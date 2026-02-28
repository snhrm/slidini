import fs from "node:fs"
import { z } from "zod"

// ===== Zod Schemas =====

const voicevoxConfigSchema = z.object({
	url: z.string().default("http://localhost:50021"),
	speaker: z.number().int().min(0).default(3),
	speed: z.number().min(0.1).max(5).default(1.0),
})

const slideConfigSchema = z
	.object({
		slideIndex: z.number().int().min(0),
		narration: z.string().optional(),
		audioFile: z.string().optional(),
		duration: z.number().min(0).nullable().default(null),
	})
	.refine((s) => !(s.narration && s.audioFile), {
		message: "narration and audioFile are mutually exclusive",
	})

const bgmSlideRangeSchema = z.object({
	fromSlide: z.number().int().min(0).optional(),
	toSlide: z.number().int().min(0).optional(),
})

const bgmTimeRangeSchema = z.object({
	fromTime: z.number().min(0).optional(),
	toTime: z.number().min(0).optional(),
})

const bgmConfigBaseSchema = z.object({
	src: z.string(),
	volume: z.number().min(0).max(1).default(0.15),
	loop: z.boolean().default(true),
	fadeIn: z.number().min(0).default(0),
	fadeOut: z.number().min(0).default(0),
})

const bgmConfigSchema = bgmConfigBaseSchema.and(z.union([bgmSlideRangeSchema, bgmTimeRangeSchema]))

export const videoConfigSchema = z.object({
	input: z.string(),
	voicevox: voicevoxConfigSchema.optional(),
	fps: z.number().int().min(1).default(30),
	defaultSlideDuration: z.number().min(0).default(5),
	slides: z.array(slideConfigSchema).default([]),
	bgm: z.array(bgmConfigSchema).default([]),
})

// ===== Types =====

export type VideoConfig = z.infer<typeof videoConfigSchema>
export type SlideConfig = z.infer<typeof slideConfigSchema>
export type BgmConfig = z.infer<typeof bgmConfigSchema>
export type VoicevoxConfig = z.infer<typeof voicevoxConfigSchema>

// ===== Parser =====

export type VideoConfigParseResult =
	| { success: true; data: VideoConfig }
	| { success: false; error: z.ZodError }

export function parseVideoConfig(data: unknown): VideoConfigParseResult {
	const result = videoConfigSchema.safeParse(data)
	if (result.success) {
		return { success: true, data: result.data }
	}
	return { success: false, error: result.error }
}

export function loadVideoConfig(filePath: string): VideoConfig {
	const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"))
	const result = parseVideoConfig(raw)
	if (!result.success) {
		console.error("Invalid .video.json:", result.error.issues)
		process.exit(1)
	}
	return result.data
}
