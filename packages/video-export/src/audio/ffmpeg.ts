import { type ChildProcess, spawn } from "node:child_process"
import type { Writable } from "node:stream"
import type { SlideAudio } from "./prepare"

export type FFmpegProcess = {
	stdin: Writable
	process: ChildProcess
	done: Promise<void>
}

export type ResolvedBgm = {
	src: string
	volume: number
	loop: boolean
	fadeIn: number // seconds
	fadeOut: number // seconds
	startMs: number
	endMs: number
}

function findFFmpeg(): string {
	// Try ffmpeg-static first, then system ffmpeg
	try {
		const ffmpegStatic = require.resolve("ffmpeg-static")
		return ffmpegStatic
	} catch {
		return "ffmpeg"
	}
}

export function buildFFmpegArgs(
	fps: number,
	slideAudios: SlideAudio[],
	bgms: ResolvedBgm[],
	totalDurationMs: number,
	outputPath: string,
): string[] {
	const args = [
		"-y",
		"-framerate",
		String(fps),
		"-f",
		"image2pipe",
		"-c:v",
		"png",
		"-i",
		"-", // stdin: frame images
	]

	const hasAudio = bgms.length > 0 || slideAudios.length > 0

	// BGM inputs
	for (const bgm of bgms) {
		if (bgm.loop) {
			args.push("-stream_loop", "-1")
		}
		args.push("-i", bgm.src)
	}

	// Narration WAV inputs
	for (const audio of slideAudios) {
		args.push("-i", audio.wavPath)
	}

	if (hasAudio) {
		const filters: string[] = []
		const mixInputs: string[] = []
		let idx = 1 // input 0 is video

		// Process BGM tracks
		for (const bgm of bgms) {
			const label = `bgm${idx}`
			const filterParts: string[] = []

			// Volume
			filterParts.push(`volume=${bgm.volume}`)

			// Fade in
			if (bgm.fadeIn > 0) {
				filterParts.push(`afade=t=in:st=0:d=${bgm.fadeIn}`)
			}

			// Fade out
			if (bgm.fadeOut > 0) {
				const fadeOutStart = (bgm.endMs - bgm.startMs) / 1000 - bgm.fadeOut
				if (fadeOutStart > 0) {
					filterParts.push(`afade=t=out:st=${fadeOutStart}:d=${bgm.fadeOut}`)
				}
			}

			// Trim to the BGM's time range within the track
			const durationSec = (bgm.endMs - bgm.startMs) / 1000
			filterParts.push(`atrim=0:${durationSec}`)

			// Delay to position the BGM at its start time in the output
			const delayMs = Math.round(bgm.startMs)
			if (delayMs > 0) {
				filterParts.push(`adelay=${delayMs}|${delayMs}`)
			}

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
	}

	args.push("-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-shortest", outputPath)

	return args
}

export function spawnFFmpeg(
	fps: number,
	slideAudios: SlideAudio[],
	bgms: ResolvedBgm[],
	totalDurationMs: number,
	outputPath: string,
): FFmpegProcess {
	const ffmpegPath = findFFmpeg()
	const args = buildFFmpegArgs(fps, slideAudios, bgms, totalDurationMs, outputPath)

	const proc = spawn(ffmpegPath, args, {
		stdio: ["pipe", "pipe", "pipe"],
	})

	const done = new Promise<void>((resolve, reject) => {
		let stderr = ""
		proc.stderr?.on("data", (data: Buffer) => {
			stderr += data.toString()
		})
		proc.on("close", (code) => {
			if (code === 0) {
				resolve()
			} else {
				reject(new Error(`FFmpeg exited with code ${code}\n${stderr}`))
			}
		})
		proc.on("error", (err) => {
			if ((err as NodeJS.ErrnoException).code === "ENOENT") {
				reject(
					new Error(
						"FFmpeg not found. Install it: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)",
					),
				)
			} else {
				reject(err)
			}
		})
	})

	if (!proc.stdin) {
		throw new Error("FFmpeg stdin is not available")
	}

	return {
		stdin: proc.stdin,
		process: proc,
		done,
	}
}
