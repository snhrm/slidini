import fs from "node:fs"
import path from "node:path"
import { type Presentation, parsePresentation } from "@slidini/core"
import type { ResolvedBgm } from "./audio/ffmpeg"
import { spawnFFmpeg } from "./audio/ffmpeg"
import { prepareAudio } from "./audio/prepare"
import { launchBrowser } from "./capture/browser"
import { captureFrames } from "./capture/pipeline"
import { startViteServer } from "./capture/server"
import type { BgmConfig, VideoConfig } from "./config"

function getMaxStepForSlide(slide: Presentation["slides"][number]): number {
	let max = 0
	for (const el of slide.elements) {
		for (const anim of el.animations) {
			if (anim.stepIndex > max) max = anim.stepIndex
		}
	}
	return max
}

/** Resolve BGM configs into absolute time ranges (ms) */
function resolveBgms(
	bgmConfigs: BgmConfig[],
	slideDurations: number[],
	totalDurationMs: number,
	configDir: string,
): ResolvedBgm[] {
	// Build cumulative start times for each slide
	const slideStartTimes: number[] = []
	let cumulative = 0
	for (const d of slideDurations) {
		slideStartTimes.push(cumulative)
		cumulative += d
	}

	return bgmConfigs.map((bgm) => {
		let startMs: number
		let endMs: number

		if ("fromTime" in bgm && bgm.fromTime != null) {
			// Time-based range
			startMs = bgm.fromTime * 1000
			endMs = "toTime" in bgm && bgm.toTime != null ? bgm.toTime * 1000 : totalDurationMs
		} else {
			// Slide-based range
			const fromSlide = "fromSlide" in bgm && bgm.fromSlide != null ? bgm.fromSlide : 0
			const toSlide =
				"toSlide" in bgm && bgm.toSlide != null ? bgm.toSlide : slideDurations.length - 1

			startMs = slideStartTimes[fromSlide] ?? 0
			// End at the end of the toSlide
			endMs = (slideStartTimes[toSlide] ?? 0) + (slideDurations[toSlide] ?? 0)
		}

		return {
			src: path.resolve(configDir, bgm.src),
			volume: bgm.volume,
			loop: bgm.loop,
			fadeIn: bgm.fadeIn,
			fadeOut: bgm.fadeOut,
			startMs,
			endMs,
		}
	})
}

export async function renderVideo(
	config: VideoConfig,
	configDir: string,
	configPath: string,
	outputPath: string,
): Promise<void> {
	const inputPath = path.resolve(configDir, config.input)

	console.log("\nSlidini Video Export")
	console.log(`  Input:  ${inputPath}`)
	console.log(`  Output: ${outputPath}`)
	console.log(`  FPS:    ${config.fps}`)

	// Load and validate presentation
	const raw = JSON.parse(fs.readFileSync(inputPath, "utf-8"))
	const result = parsePresentation(raw)
	if (!result.success) {
		console.error("Invalid .slide.json:", result.error.issues)
		process.exit(1)
	}
	const presentation = result.data as Presentation
	console.log(`  Slides: ${presentation.slides.length}`)

	// Phase 1: Audio preparation
	console.log("\n[Phase 1] Preparing audio...")
	const audioPlan = await prepareAudio(presentation, config, configDir)
	console.log(`  Total duration: ${(audioPlan.totalDurationMs / 1000).toFixed(1)}s`)

	// Write back config if audioFile paths were added
	if (audioPlan.configUpdated) {
		fs.writeFileSync(configPath, `${JSON.stringify(config, null, "\t")}\n`, "utf-8")
		console.log(`  Updated config: ${configPath}`)
	}

	// Resolve BGM time ranges
	const resolvedBgms = resolveBgms(
		config.bgm,
		audioPlan.slideDurations,
		audioPlan.totalDurationMs,
		configDir,
	)
	if (resolvedBgms.length > 0) {
		console.log(`  BGM tracks: ${resolvedBgms.length}`)
	}

	// Build slide timing for ExportPlayer
	const slideTiming = presentation.slides.map((slide, i) => ({
		durationMs: audioPlan.slideDurations[i] ?? config.defaultSlideDuration * 1000,
		steps: getMaxStepForSlide(slide),
	}))

	const exportConfig = {
		presentation,
		slideTiming,
	}

	// Phase 2: Frame capture
	console.log("\n[Phase 2] Capturing frames...")
	const { server, port } = await startViteServer()

	try {
		const { width, height } = presentation.meta
		const exportBrowser = await launchBrowser(port, exportConfig, width, height)

		try {
			// Spawn FFmpeg
			const ffmpeg = spawnFFmpeg(
				config.fps,
				audioPlan.slideAudios,
				resolvedBgms,
				audioPlan.totalDurationMs,
				outputPath,
			)

			// Capture frames and pipe to FFmpeg
			const totalFrames = Math.ceil(audioPlan.totalDurationMs / (1000 / config.fps))
			console.log(`  Total frames: ${totalFrames}`)

			await captureFrames(
				exportBrowser.page,
				ffmpeg.stdin,
				config.fps,
				audioPlan.totalDurationMs,
				({ frame, totalFrames }) => {
					const pct = ((frame / totalFrames) * 100).toFixed(1)
					process.stdout.write(`\r  Progress: ${frame}/${totalFrames} (${pct}%)`)
				},
			)

			// Close FFmpeg stdin and wait for encoding to finish
			ffmpeg.stdin.end()
			console.log("\n\n[Phase 3] Encoding video...")
			await ffmpeg.done
		} finally {
			await exportBrowser.close()
		}
	} finally {
		await server.close()
	}

	const outputSize = fs.statSync(outputPath).size
	console.log(`\nDone! Output: ${outputPath} (${(outputSize / 1024 / 1024).toFixed(1)} MB)`)
}
