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
// Returns the current slide index and done flag from the ExportPlayer.
async function advanceTime(
	page: Page,
	ms: number,
): Promise<{ slideIndex: number; isDone: boolean }> {
	return await page.evaluate(async (ms: number) => {
		const tw = (globalThis as Record<string, unknown>).timeweb as
			| { goTo(ms: number): Promise<void> }
			| undefined
		await tw?.goTo(ms)
		const w = window as unknown as Record<string, unknown>
		return {
			slideIndex: (w.__EXPORT_SLIDE_INDEX__ as number) ?? -1,
			isDone: w.__EXPORT_DONE__ === true,
		}
	}, ms)
}

// Simplified advanceTime that only advances time (for transition re-fire)
async function advanceTimeOnly(page: Page, ms: number): Promise<void> {
	await page.evaluate(async (ms: number) => {
		const tw = (globalThis as Record<string, unknown>).timeweb as
			| { goTo(ms: number): Promise<void> }
			| undefined
		await tw?.goTo(ms)
	}, ms)
}

export async function captureFrames(
	page: Page,
	ffmpegStdin: Writable,
	fps: number,
	totalDurationMs: number,
	onProgress?: (progress: CaptureProgress) => void,
): Promise<number> {
	const frameDurationMs = 1000 / fps
	const totalFrames = Math.ceil(totalDurationMs / frameDurationMs)
	let currentTimeMs = 0
	let prevSlideIndex = -1
	let capturedFrames = 0

	for (let frame = 0; frame < totalFrames; frame++) {
		// Step 1: Advance virtual time and get state in one CDP call.
		const { slideIndex, isDone } = await advanceTime(page, currentTimeMs)
		if (isDone) break

		// Step 2: Let React settle.
		const isTransition = slideIndex !== prevSlideIndex && prevSlideIndex !== -1
		await waitForReact(page, isTransition ? 10 : 2)

		// Step 3: If a slide change occurred, fire newly registered rAF callbacks.
		if (isTransition) {
			await advanceTimeOnly(page, currentTimeMs)
			await waitForReact(page, 5)
		}
		prevSlideIndex = slideIndex

		// Screenshot and pipe to FFmpeg
		const buffer = await page.screenshot({ type: "jpeg", quality: 90, omitBackground: false })
		const writeOk = ffmpegStdin.write(buffer)
		if (!writeOk) {
			await new Promise<void>((resolve) => ffmpegStdin.once("drain", resolve))
		}

		capturedFrames++

		// Periodic GC every 300 frames to prevent memory buildup
		if (capturedFrames % 300 === 0) {
			await page.evaluate(() => {
				const gc = (globalThis as Record<string, unknown>).gc as (() => void) | undefined
				gc?.()
			})
		}

		onProgress?.({
			frame: capturedFrames,
			totalFrames,
			timeMs: currentTimeMs,
			totalTimeMs: totalDurationMs,
		})

		currentTimeMs += frameDurationMs
	}

	return capturedFrames
}
