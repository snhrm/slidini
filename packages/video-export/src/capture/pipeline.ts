import type { Writable } from "node:stream"
import type { Page } from "puppeteer"

export type CaptureProgress = {
	frame: number
	totalFrames: number
	timeMs: number
	totalTimeMs: number
}

// Pump the browser event loop via MessageChannel ticks.
// React 18+ schedules renders via MessageChannel (not affected by timeweb),
// so we need to let the event loop run for React to process state changes,
// effects, and re-renders.
async function waitForReact(page: Page, ticks = 10): Promise<void> {
	await page.evaluate(
		(n: number) =>
			new Promise<void>((resolve) => {
				let remaining = n
				function tick() {
					if (--remaining <= 0) {
						resolve()
						return
					}
					const ch = new MessageChannel()
					ch.port1.onmessage = tick
					ch.port2.postMessage(null)
				}
				tick()
			}),
		ticks,
	)
}

// Call timeweb.goTo(ms) to advance virtual time, fire timers and rAF callbacks.
// Returns the current slide index from the ExportPlayer.
async function advanceTime(page: Page, ms: number): Promise<number> {
	return await page.evaluate(async (ms: number) => {
		const tw = (globalThis as Record<string, unknown>).timeweb as
			| { goTo(ms: number): Promise<void> }
			| undefined
		await tw?.goTo(ms)
		// Return current slide index for transition detection
		return (window as unknown as Record<string, number>).__EXPORT_SLIDE_INDEX__ ?? -1
	}, ms)
}

export async function captureFrames(
	page: Page,
	ffmpegStdin: Writable,
	fps: number,
	totalDurationMs: number,
	onProgress?: (progress: CaptureProgress) => void,
): Promise<void> {
	const frameDurationMs = 1000 / fps
	const totalFrames = Math.ceil(totalDurationMs / frameDurationMs)
	let currentTimeMs = 0
	let prevSlideIndex = -1

	for (let frame = 0; frame < totalFrames; frame++) {
		// Step 1: Advance virtual time.
		// timeweb.goTo(T) processes timers up to T, then fires rAF callbacks
		// that were registered BEFORE this call.
		const slideIndex = await advanceTime(page, currentTimeMs)

		// Step 2: Let React settle.
		// goTo may have fired setTimeout callbacks that call setState.
		// React 18 schedules renders via MessageChannel.
		await waitForReact(page)

		// Step 3: If a slide change occurred, fire newly registered rAF callbacks.
		// After React re-renders for a slide change, newly mounted motion.div
		// components (Framer Motion) register rAF callbacks that were NOT fired
		// by Step 1. We call goTo again to fire them.
		if (slideIndex !== prevSlideIndex && prevSlideIndex !== -1) {
			await advanceTime(page, currentTimeMs)
			await waitForReact(page, 5)
		}
		prevSlideIndex = slideIndex

		// Check if export is done (all slides finished)
		const isDone = await page.evaluate(
			() => (window as unknown as Record<string, unknown>).__EXPORT_DONE__ === true,
		)
		if (isDone) break

		// Screenshot and pipe to FFmpeg
		const buffer = await page.screenshot({ type: "png", omitBackground: false })
		const writeOk = ffmpegStdin.write(buffer)
		if (!writeOk) {
			await new Promise<void>((resolve) => ffmpegStdin.once("drain", resolve))
		}

		onProgress?.({
			frame: frame + 1,
			totalFrames,
			timeMs: currentTimeMs,
			totalTimeMs: totalDurationMs,
		})

		currentTimeMs += frameDurationMs
	}
}
