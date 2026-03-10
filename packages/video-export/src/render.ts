import fs from "node:fs"
import path from "node:path"
import { type Presentation, parsePresentation } from "@slidini/core"
import type { ResolvedBgm } from "./audio/ffmpeg"
import { buildFFmpegArgs, spawnFFmpeg } from "./audio/ffmpeg"
import { prepareAudio } from "./audio/prepare"
import { launchBrowser } from "./capture/browser"
import {
	concatChunks,
	getOptimalWorkers,
	renderParallel,
	splitIntoChunks,
} from "./capture/parallel"
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

/** Build audio-only FFmpeg args for muxing */
function buildAudioArgs(
	slideAudios: { wavPath: string; startTimeMs: number }[],
	resolvedBgms: ResolvedBgm[],
	totalDurationMs: number,
): string[] {
	const args: string[] = []
	const hasAudio = resolvedBgms.length > 0 || slideAudios.length > 0
	if (!hasAudio) return args

	// BGM inputs
	for (const bgm of resolvedBgms) {
		if (bgm.loop) args.push("-stream_loop", "-1")
		args.push("-i", bgm.src)
	}

	// Narration inputs
	for (const audio of slideAudios) {
		args.push("-i", audio.wavPath)
	}

	const filters: string[] = []
	const mixInputs: string[] = []
	let idx = 1 // input 0 is video (added by caller)

	// Process BGM tracks
	for (const bgm of resolvedBgms) {
		const label = `bgm${idx}`
		const filterParts: string[] = []
		filterParts.push(`volume=${bgm.volume}`)
		if (bgm.fadeIn > 0) filterParts.push(`afade=t=in:st=0:d=${bgm.fadeIn}`)
		if (bgm.fadeOut > 0) {
			const fadeOutStart = (bgm.endMs - bgm.startMs) / 1000 - bgm.fadeOut
			if (fadeOutStart > 0) filterParts.push(`afade=t=out:st=${fadeOutStart}:d=${bgm.fadeOut}`)
		}
		const durationSec = (bgm.endMs - bgm.startMs) / 1000
		filterParts.push(`atrim=0:${durationSec}`)
		const delayMs = Math.round(bgm.startMs)
		if (delayMs > 0) filterParts.push(`adelay=${delayMs}|${delayMs}`)
		filters.push(`[${idx}:a]${filterParts.join(",")}[${label}]`)
		mixInputs.push(`[${label}]`)
		idx++
	}

	// Process narration tracks
	for (const audio of slideAudios) {
		const label = `n${idx}`
		const delay = Math.round(audio.startTimeMs)
		filters.push(`[${idx}:a]adelay=${delay}|${delay}[${label}]`)
		mixInputs.push(`[${label}]`)
		idx++
	}

	if (mixInputs.length > 1) {
		filters.push(
			`${mixInputs.join("")}amix=inputs=${mixInputs.length}:duration=first:dropout_transition=0:normalize=0[aout]`,
		)
		args.push("-filter_complex", filters.join(";"), "-map", "0:v", "-map", "[aout]")
	} else if (mixInputs.length === 1) {
		args.push("-filter_complex", filters.join(";"), "-map", "0:v", "-map", `${mixInputs[0]}`)
	}

	args.push("-c:a", "aac", "-b:a", "192k")
	return args
}

export type RenderOptions = {
	forceRegenerateAudio?: boolean
	scaleFactor?: number
	workers?: number
}

export async function renderVideo(
	config: VideoConfig,
	configDir: string,
	configPath: string,
	outputPath: string,
	options?: RenderOptions,
): Promise<void> {
	const inputPath = path.isAbsolute(config.input)
		? config.input
		: path.resolve(configDir, config.input)

	const workers = getOptimalWorkers(options?.workers)

	console.log("\nSlidini Video Export")
	console.log(`  Input:  ${inputPath}`)
	console.log(`  Output: ${outputPath}`)
	console.log(`  FPS:    ${config.fps}`)
	console.log(`  Workers: ${workers}`)

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
	const audioPlan = await prepareAudio(presentation, config, configDir, {
		forceRegenerate: options?.forceRegenerateAudio,
	})
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

	const scale = options?.scaleFactor ?? 1
	const hasAudio = resolvedBgms.length > 0 || audioPlan.slideAudios.length > 0

	// Phase 2: Frame capture
	console.log("\n[Phase 2] Capturing frames...")
	const { server, port } = await startViteServer()

	try {
		if (workers <= 1) {
			// Single-worker mode (original behavior)
			await renderSingle(
				presentation,
				slideTiming,
				config,
				audioPlan,
				resolvedBgms,
				port,
				scale,
				outputPath,
			)
		} else {
			// Multi-worker parallel mode
			const tmpDir = path.join(configDir, ".video-tmp")

			await renderParallel({
				presentation,
				slideTiming,
				fps: config.fps,
				scaleFactor: scale,
				port,
				workers,
				tmpDir,
			})

			// Phase 3: Concatenate chunks
			console.log("\n[Phase 3] Concatenating chunks...")
			const chunks = splitIntoChunks(slideTiming, workers, tmpDir)

			if (hasAudio) {
				// Concat video chunks → temp file, then mux audio
				const videoOnlyPath = path.join(tmpDir, "video-only.mp4")
				const concat = concatChunks(chunks, videoOnlyPath)
				await concat.done

				console.log("[Phase 4] Muxing audio...")
				const audioArgs = buildAudioArgs(
					audioPlan.slideAudios,
					resolvedBgms,
					audioPlan.totalDurationMs,
				)
				const { done: muxDone } = muxAudio(videoOnlyPath, audioArgs, outputPath)
				await muxDone

				// Cleanup video-only temp
				try {
					fs.unlinkSync(videoOnlyPath)
				} catch {}
			} else {
				// No audio: just concat directly to output
				const concat = concatChunks(chunks, outputPath)
				await concat.done
			}
		}
	} finally {
		await server.close()
	}

	const outputSize = fs.statSync(outputPath).size
	console.log(`\nDone! Output: ${outputPath} (${(outputSize / 1024 / 1024).toFixed(1)} MB)`)
}

/** Single-worker render (original pipeline) */
async function renderSingle(
	presentation: Presentation,
	slideTiming: { durationMs: number; steps: number }[],
	config: VideoConfig,
	audioPlan: { totalDurationMs: number; slideAudios: import("./audio/prepare").SlideAudio[] },
	resolvedBgms: ResolvedBgm[],
	port: number,
	scale: number,
	outputPath: string,
): Promise<void> {
	const { width, height } = presentation.meta
	const exportConfig = { presentation, slideTiming }
	const exportBrowser = await launchBrowser(port, exportConfig, width, height, scale)

	try {
		const ffmpeg = spawnFFmpeg(
			config.fps,
			audioPlan.slideAudios,
			resolvedBgms,
			audioPlan.totalDurationMs,
			outputPath,
		)

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

		ffmpeg.stdin.end()
		console.log("\n\n[Phase 3] Encoding video...")
		await ffmpeg.done
	} finally {
		await exportBrowser.close()
	}
}

/** Mux a video file with audio args */
function muxAudio(
	videoPath: string,
	audioArgs: string[],
	outputPath: string,
): { done: Promise<void> } {
	const { spawn } = require("node:child_process")
	let ffmpegPath: string
	try {
		ffmpegPath = require.resolve("ffmpeg-static")
	} catch {
		ffmpegPath = "ffmpeg"
	}

	const args = ["-y", "-i", videoPath, ...audioArgs, "-c:v", "copy", "-shortest", outputPath]
	const proc = spawn(ffmpegPath, args, { stdio: ["pipe", "pipe", "pipe"] })
	const done = new Promise<void>((resolve, reject) => {
		let stderr = ""
		proc.stderr?.on("data", (data: Buffer) => {
			stderr += data.toString()
		})
		proc.on("close", (code: number) => {
			if (code === 0) resolve()
			else reject(new Error(`FFmpeg mux exited with code ${code}\n${stderr}`))
		})
		proc.on("error", reject)
	})

	return { done }
}
