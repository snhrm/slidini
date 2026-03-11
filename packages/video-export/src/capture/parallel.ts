import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { type ChildProcess, spawn } from "node:child_process"
import type { Presentation } from "@slidini/core"
import { launchBrowser } from "./browser"
import { captureFrames } from "./pipeline"

export type ChunkDef = {
	index: number
	startSlide: number
	endSlide: number // inclusive
	durationMs: number
	outputPath: string
}

export type SlideTiming = {
	durationMs: number
	steps: number
}

export type ParallelConfig = {
	presentation: Presentation
	slideTiming: SlideTiming[]
	fps: number
	scaleFactor: number
	port: number
	workers: number
	tmpDir: string
}

function findFFmpeg(): string {
	try {
		const ffmpegStatic = require.resolve("ffmpeg-static")
		return ffmpegStatic
	} catch {
		return "ffmpeg"
	}
}

/** Split slides into N roughly equal chunks by duration */
export function splitIntoChunks(
	slideTiming: SlideTiming[],
	workers: number,
	tmpDir: string,
): ChunkDef[] {
	const totalMs = slideTiming.reduce((sum, t) => sum + t.durationMs, 0)
	const targetMs = totalMs / workers
	const chunks: ChunkDef[] = []

	let chunkStart = 0
	let chunkDuration = 0
	let chunkIndex = 0

	for (let i = 0; i < slideTiming.length; i++) {
		const timing = slideTiming[i]
		if (!timing) continue
		chunkDuration += timing.durationMs

		const isLast = i === slideTiming.length - 1
		const chunksFull = chunkIndex < workers - 1 && chunkDuration >= targetMs

		if (isLast || chunksFull) {
			chunks.push({
				index: chunkIndex,
				startSlide: chunkStart,
				endSlide: i,
				durationMs: chunkDuration,
				outputPath: path.join(tmpDir, `chunk-${chunkIndex}.mp4`),
			})
			chunkIndex++
			chunkStart = i + 1
			chunkDuration = 0
		}
	}

	return chunks
}

/** Progress tracker for parallel rendering */
class ParallelProgress {
	private states: {
		frame: number
		totalFrames: number
		done: boolean
		startSlide: number
		endSlide: number
	}[]
	private lineCount = 0
	private startTime: number
	private totalFramesAll: number

	constructor(chunks: ChunkDef[], fps: number) {
		this.states = chunks.map((c) => ({
			frame: 0,
			totalFrames: Math.ceil(c.durationMs / (1000 / fps)),
			done: false,
			startSlide: c.startSlide,
			endSlide: c.endSlide,
		}))
		this.startTime = Date.now()
		this.totalFramesAll = this.states.reduce((sum, s) => sum + s.totalFrames, 0)
	}

	update(chunkIndex: number, frame: number) {
		const state = this.states[chunkIndex]
		if (state) state.frame = frame
		this.render()
	}

	markDone(chunkIndex: number, capturedFrames: number) {
		const state = this.states[chunkIndex]
		if (state) {
			state.frame = capturedFrames
			state.done = true
		}
		this.render()
	}

	private render() {
		// Move cursor up to overwrite previous output
		if (this.lineCount > 0) {
			process.stdout.write(`\x1b[${this.lineCount}A`)
		}

		const lines: string[] = []

		// Overall progress
		const totalDone = this.states.reduce((sum, s) => sum + s.frame, 0)
		const overallPct = ((totalDone / this.totalFramesAll) * 100).toFixed(1)
		const elapsed = (Date.now() - this.startTime) / 1000
		const fps = totalDone > 0 ? (totalDone / elapsed).toFixed(1) : "—"
		const elapsedStr = this.formatTime(elapsed)
		const etaStr =
			totalDone > 0
				? this.formatTime(((this.totalFramesAll - totalDone) / totalDone) * elapsed)
				: "—"
		lines.push(
			`  Overall: ${totalDone}/${this.totalFramesAll} (${overallPct}%) | ${fps} fps | 経過 ${elapsedStr} | 残り ${etaStr}`,
		)

		// Per-chunk progress bars
		for (let i = 0; i < this.states.length; i++) {
			const s = this.states[i]
			if (!s) continue
			const pct = s.totalFrames > 0 ? s.frame / s.totalFrames : 0
			const barWidth = 20
			const filled = Math.round(pct * barWidth)
			const bar = "█".repeat(filled) + "░".repeat(barWidth - filled)
			const status = s.done ? "✓" : `${(pct * 100).toFixed(0)}%`
			lines.push(
				`  Chunk ${i + 1} ${bar} ${status.padStart(4)} [slides ${s.startSlide + 1}-${s.endSlide + 1}]`,
			)
		}

		// Write all lines, clearing each to end of line
		for (const line of lines) {
			process.stdout.write(`${line}\x1b[K\n`)
		}
		this.lineCount = lines.length
	}

	private formatTime(seconds: number): string {
		const m = Math.floor(seconds / 60)
		const s = Math.round(seconds % 60)
		return m > 0 ? `${m}分${s}秒` : `${s}秒`
	}

	finish() {
		const elapsed = (Date.now() - this.startTime) / 1000
		const totalDone = this.states.reduce((sum, s) => sum + s.frame, 0)
		console.log(`  Captured ${totalDone} frames in ${this.formatTime(elapsed)}`)
	}
}

/** Render a single chunk: launch browser, capture frames, encode to mp4 */
async function renderChunk(
	chunk: ChunkDef,
	config: ParallelConfig,
	progress: ParallelProgress,
): Promise<void> {
	const { presentation, slideTiming, fps, scaleFactor, port } = config
	const { width, height } = presentation.meta

	const exportConfig = {
		presentation,
		slideTiming,
		startSlide: chunk.startSlide,
		endSlide: chunk.endSlide,
	}

	const browser = await launchBrowser(port, exportConfig, width, height, scaleFactor)

	try {
		// Spawn FFmpeg for this chunk (video only, no audio)
		const ffmpegPath = findFFmpeg()
		const args = [
			"-y",
			"-framerate",
			String(fps),
			"-f",
			"image2pipe",
			"-c:v",
			"mjpeg",
			"-i",
			"-",
			"-c:v",
			"libx264",
			"-preset",
			"veryfast",
			"-pix_fmt",
			"yuv420p",
			"-crf",
			"18",
			chunk.outputPath,
		]

		const ffmpeg = spawn(ffmpegPath, args, { stdio: ["pipe", "pipe", "pipe"] })
		const ffmpegDone = new Promise<void>((resolve, reject) => {
			let stderr = ""
			ffmpeg.stderr?.on("data", (data: Buffer) => {
				stderr += data.toString()
			})
			ffmpeg.on("close", (code) => {
				if (code === 0) resolve()
				else reject(new Error(`FFmpeg chunk ${chunk.index} exited with code ${code}\n${stderr}`))
			})
			ffmpeg.on("error", reject)
		})

		if (!ffmpeg.stdin) throw new Error("FFmpeg stdin not available")

		const captured = await captureFrames(
			browser.page,
			ffmpeg.stdin,
			fps,
			chunk.durationMs,
			({ frame }) => {
				progress.update(chunk.index, frame)
			},
		)

		ffmpeg.stdin.end()
		await ffmpegDone
		progress.markDone(chunk.index, captured)
	} finally {
		await browser.close()
	}
}

/** Concatenate chunk mp4 files into one, then mux audio */
export function concatChunks(
	chunks: ChunkDef[],
	outputPath: string,
): { process: ChildProcess; done: Promise<void> } {
	const ffmpegPath = findFFmpeg()
	const listPath = path.join(path.dirname(chunks[0]?.outputPath ?? ""), "concat-list.txt")
	const listContent = chunks.map((c) => `file '${c.outputPath}'`).join("\n")
	fs.writeFileSync(listPath, listContent)

	const args = ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", outputPath]

	const proc = spawn(ffmpegPath, args, { stdio: ["pipe", "pipe", "pipe"] })
	const done = new Promise<void>((resolve, reject) => {
		let stderr = ""
		proc.stderr?.on("data", (data: Buffer) => {
			stderr += data.toString()
		})
		proc.on("close", (code) => {
			// Cleanup
			fs.unlinkSync(listPath)
			for (const c of chunks) {
				try {
					fs.unlinkSync(c.outputPath)
				} catch {}
			}
			try {
				fs.rmdirSync(path.dirname(listPath))
			} catch {}

			if (code === 0) resolve()
			else reject(new Error(`FFmpeg concat exited with code ${code}\n${stderr}`))
		})
		proc.on("error", reject)
	})

	return { process: proc, done }
}

/** Mux video (no audio) with audio tracks */
export function muxAudio(
	videoPath: string,
	audioArgs: string[],
	outputPath: string,
): { process: ChildProcess; done: Promise<void> } {
	const ffmpegPath = findFFmpeg()
	const args = ["-y", "-i", videoPath, ...audioArgs, "-c:v", "copy", "-shortest", outputPath]

	const proc = spawn(ffmpegPath, args, { stdio: ["pipe", "pipe", "pipe"] })
	const done = new Promise<void>((resolve, reject) => {
		let stderr = ""
		proc.stderr?.on("data", (data: Buffer) => {
			stderr += data.toString()
		})
		proc.on("close", (code) => {
			if (code === 0) resolve()
			else reject(new Error(`FFmpeg mux exited with code ${code}\n${stderr}`))
		})
		proc.on("error", reject)
	})

	return { process: proc, done }
}

/** Determine optimal worker count based on system resources */
export function getOptimalWorkers(requestedWorkers?: number): number {
	if (requestedWorkers && requestedWorkers > 0) return requestedWorkers

	const cpuCores = os.cpus().length
	const totalMemGB = os.totalmem() / (1024 * 1024 * 1024)
	const memBasedMax = Math.floor(totalMemGB / 3) // ~3GB per 4K browser
	const cpuBasedMax = Math.floor(cpuCores / 4)

	return Math.max(1, Math.min(memBasedMax, cpuBasedMax, 8))
}

/** Main parallel render entry point */
export async function renderParallel(config: ParallelConfig): Promise<void> {
	const { slideTiming, workers, tmpDir, fps } = config

	fs.mkdirSync(tmpDir, { recursive: true })

	const chunks = splitIntoChunks(slideTiming, workers, tmpDir)
	console.log(`  Parallel: ${chunks.length} chunks across ${workers} workers`)
	for (const c of chunks) {
		console.log(
			`    Chunk ${c.index + 1}: slides ${c.startSlide + 1}-${c.endSlide + 1} (${(c.durationMs / 1000).toFixed(1)}s)`,
		)
	}
	console.log("")

	const progress = new ParallelProgress(chunks, fps)

	// Run all chunks in parallel (worker count = chunk count)
	await Promise.all(chunks.map((chunk) => renderChunk(chunk, config, progress)))
	progress.finish()
}
