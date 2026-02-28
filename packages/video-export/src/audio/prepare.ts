import fs from "node:fs"
import path from "node:path"
import type { Presentation } from "@slidini/core"
import type { VideoConfig } from "../config"
import { createVoicevoxClient, getWavDurationMs } from "../voicevox/client"

export type SlideAudio = {
	slideIndex: number
	wavPath: string
	durationMs: number
	startTimeMs: number
}

export type AudioPlan = {
	slideAudios: SlideAudio[]
	slideDurations: number[] // ms per slide
	totalDurationMs: number
	tempDir: string
}

export async function prepareAudio(
	presentation: Presentation,
	config: VideoConfig,
	configDir: string,
	tempDir: string,
): Promise<AudioPlan> {
	const slideAudios: SlideAudio[] = []
	const slideDurations: number[] = []
	let currentTimeMs = 0

	// Build a map of slideIndex -> slideConfig for quick lookup
	const slideConfigMap = new Map(config.slides.map((s) => [s.slideIndex, s]))

	// Check if any slides need VOICEVOX
	const needsVoicevox = config.slides.some((s) => s.narration)
	let voicevoxClient: ReturnType<typeof createVoicevoxClient> | null = null

	if (needsVoicevox) {
		if (!config.voicevox) {
			throw new Error("Slides with narration text require voicevox config in .video.json")
		}
		voicevoxClient = createVoicevoxClient(config.voicevox.url)

		const available = await voicevoxClient.isAvailable()
		if (!available) {
			throw new Error(
				`VOICEVOX is not available at ${config.voicevox.url}. Start VOICEVOX engine first: docker run --rm -p 50021:50021 voicevox/voicevox_engine:cpu-latest`,
			)
		}
		console.log("  Generating narration audio...")
	}

	const defaultDurationMs = config.defaultSlideDuration * 1000

	for (let i = 0; i < presentation.slides.length; i++) {
		const slideConfig = slideConfigMap.get(i)

		if (slideConfig?.narration && voicevoxClient && config.voicevox) {
			// Text narration via VOICEVOX
			const text = slideConfig.narration.trim()
			console.log(`    Slide ${i + 1}: "${text.slice(0, 40)}..."`)

			const wavBuffer = await voicevoxClient.synthesize(
				text,
				config.voicevox.speaker,
				config.voicevox.speed,
			)
			const wavPath = path.join(tempDir, `slide-${String(i).padStart(3, "0")}.wav`)
			fs.writeFileSync(wavPath, wavBuffer)

			const durationMs = getWavDurationMs(wavBuffer)
			const slideDurationMs =
				slideConfig.duration != null ? slideConfig.duration * 1000 : durationMs + 1000

			slideAudios.push({
				slideIndex: i,
				wavPath,
				durationMs,
				startTimeMs: currentTimeMs + 500,
			})
			slideDurations.push(slideDurationMs)
		} else if (slideConfig?.audioFile) {
			// Pre-recorded audio file
			const audioPath = path.resolve(configDir, slideConfig.audioFile)
			if (!fs.existsSync(audioPath)) {
				throw new Error(`Audio file not found: ${audioPath} (slide ${i})`)
			}

			const wavBuffer = fs.readFileSync(audioPath)
			const durationMs = getWavDurationMs(wavBuffer)
			const slideDurationMs =
				slideConfig.duration != null ? slideConfig.duration * 1000 : durationMs + 1000

			console.log(`    Slide ${i + 1}: audio file "${slideConfig.audioFile}"`)

			slideAudios.push({
				slideIndex: i,
				wavPath: audioPath,
				durationMs,
				startTimeMs: currentTimeMs + 500,
			})
			slideDurations.push(slideDurationMs)
		} else if (slideConfig?.duration != null) {
			// Fixed duration, no audio
			slideDurations.push(slideConfig.duration * 1000)
		} else {
			// Default duration
			slideDurations.push(defaultDurationMs)
		}

		const duration = slideDurations[i] ?? defaultDurationMs
		currentTimeMs += duration
	}

	return {
		slideAudios,
		slideDurations,
		totalDurationMs: currentTimeMs,
		tempDir,
	}
}
