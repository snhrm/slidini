import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { createDefaultPlayerConfig } from "@slidini/core"
import { z } from "zod"
import { err, ok, readPresentation, writePresentation } from "./index"

export function registerVideoTools(server: McpServer): void {
	// ----- slide_create_video_config -----

	server.registerTool(
		"slide_create_video_config",
		{
			title: "Create Playback Config",
			description: `Initialize the playback config in a .slide.json file. Sets default values for slide duration and step delay.

Args:
  - file_path (string): Path to the .slide.json file
  - default_slide_duration (number, optional): Default duration per slide in seconds (default: 5)
  - default_step_delay (number, optional): Default delay between steps in seconds (default: 1)

Returns: JSON summary of the created playback config.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file"),
				default_slide_duration: z
					.number()
					.min(0)
					.optional()
					.describe("Default slide duration in seconds (default: 5)"),
				default_step_delay: z
					.number()
					.min(0)
					.optional()
					.describe("Default step delay in seconds (default: 1)"),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false,
			},
		},
		async ({ file_path, default_slide_duration, default_step_delay }) => {
			try {
				const presentation = readPresentation(file_path)
				presentation.playback = {
					...createDefaultPlayerConfig(),
					defaultSlideDuration: default_slide_duration ?? 5,
					defaultStepDelay: default_step_delay ?? 1,
				}
				writePresentation(file_path, presentation)
				return ok(JSON.stringify(presentation.playback, null, 2))
			} catch (e) {
				return err(`Error creating playback config: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_read_video_config -----

	server.registerTool(
		"slide_read_video_config",
		{
			title: "Read Playback Config",
			description: `Read the playback config from a .slide.json file.

Args:
  - file_path (string): Path to the .slide.json file

Returns: Playback config JSON, or null if not set.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file"),
			},
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async ({ file_path }) => {
			try {
				const presentation = readPresentation(file_path)
				return ok(JSON.stringify(presentation.playback ?? null, null, 2))
			} catch (e) {
				return err(`Error reading playback config: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_update_video_config -----

	server.registerTool(
		"slide_update_video_config",
		{
			title: "Update Playback Config",
			description: `Update top-level playback settings in a .slide.json file. Only provided fields are updated. Creates playback config if not present.

Args:
  - file_path (string): Path to the .slide.json file
  - default_slide_duration (number, optional): Default slide duration in seconds
  - default_step_delay (number, optional): Default step delay in seconds

Returns: Updated playback config summary.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file"),
				default_slide_duration: z
					.number()
					.min(0)
					.optional()
					.describe("Default slide duration in seconds"),
				default_step_delay: z.number().min(0).optional().describe("Default step delay in seconds"),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async ({ file_path, default_slide_duration, default_step_delay }) => {
			try {
				const presentation = readPresentation(file_path)
				const playback = presentation.playback ?? createDefaultPlayerConfig()
				if (default_slide_duration !== undefined)
					playback.defaultSlideDuration = default_slide_duration
				if (default_step_delay !== undefined) playback.defaultStepDelay = default_step_delay
				presentation.playback = playback
				writePresentation(file_path, presentation)
				return ok(
					JSON.stringify(
						{
							defaultSlideDuration: playback.defaultSlideDuration,
							defaultStepDelay: playback.defaultStepDelay,
						},
						null,
						2,
					),
				)
			} catch (e) {
				return err(`Error updating playback config: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_set_slide_narration -----

	server.registerTool(
		"slide_set_slide_narration",
		{
			title: "Set Slide Narration",
			description: `Set narration for a specific slide in the .slide.json playback config. Overwrites existing entry for the slide index, or adds a new one.

IMPORTANT: Narration text is synthesized by VOICEVOX (Japanese TTS engine). All English words, technical terms, and abbreviations MUST be written in katakana pronunciation. Examples:
  - "React" → "リアクト"
  - "JavaScript" → "ジャバスクリプト"
  - "TypeScript" → "タイプスクリプト"
  - "API" → "エーピーアイ"
  - "CSS" → "シーエスエス"
  - "HTML" → "エイチティーエムエル"
  - "GitHub" → "ギットハブ"
  - "npm" → "エヌピーエム"
  - "CLI" → "シーエルアイ"
  - "UI" → "ユーアイ"
  - "JSON" → "ジェイソン"
  - "Vite" → "ヴィート"
  - "Next.js" → "ネクストジェイエス"
  - "Tailwind" → "テイルウィンド"
Do NOT leave any alphabetic words as-is in the narration text.

Args:
  - file_path (string): Path to the .slide.json file
  - slide_index (number): 0-based slide index
  - narration (string, optional): Narration text in Japanese with katakana for foreign words (mutually exclusive with audio_file)
  - audio_file (string, optional): Path to audio file (mutually exclusive with narration)
  - duration (number|null, optional): Override slide duration in seconds (null = auto)

Returns: The updated slide config entry.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file"),
				slide_index: z.number().int().min(0).describe("0-based slide index"),
				narration: z
					.string()
					.optional()
					.describe("Narration text (mutually exclusive with audio_file)"),
				audio_file: z
					.string()
					.optional()
					.describe("Path to audio file (mutually exclusive with narration)"),
				duration: z
					.number()
					.min(0)
					.nullable()
					.optional()
					.describe("Override slide duration in seconds (null = auto)"),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async ({ file_path, slide_index, narration, audio_file, duration }) => {
			try {
				if (narration !== undefined && audio_file !== undefined) {
					return err("narration and audio_file are mutually exclusive")
				}
				const presentation = readPresentation(file_path)
				const playback = presentation.playback ?? createDefaultPlayerConfig()

				const entry = {
					slideIndex: slide_index,
					...(narration !== undefined ? { narration } : {}),
					...(audio_file !== undefined ? { audioFile: audio_file } : {}),
					duration: duration !== undefined ? duration : null,
				}

				const existing = playback.slides.findIndex((s) => s.slideIndex === slide_index)
				if (existing >= 0) {
					playback.slides[existing] = entry
				} else {
					playback.slides.push(entry)
				}

				presentation.playback = playback
				writePresentation(file_path, presentation)
				return ok(JSON.stringify(entry, null, 2))
			} catch (e) {
				return err(`Error setting slide narration: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_set_bgm -----

	server.registerTool(
		"slide_set_bgm",
		{
			title: "Set BGM",
			description: `Set the BGM (background music) array in the .slide.json playback config. Replaces the entire bgm array.

Args:
  - file_path (string): Path to the .slide.json file
  - bgm (array): Array of BGM entries, each with:
    - src (string): Path to the audio file
    - volume (number, optional): Volume 0-1 (default: 0.15)
    - loop (boolean, optional): Loop the audio (default: true)
    - fade_in (number, optional): Fade-in duration in seconds (default: 0)
    - fade_out (number, optional): Fade-out duration in seconds (default: 0)
    - start_time (number, optional): Start playback at this time in seconds
    - end_time (number, optional): End playback at this time in seconds

Returns: The updated bgm array.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file"),
				bgm: z
					.array(
						z.object({
							src: z.string().describe("Path to the audio file"),
							volume: z.number().min(0).max(1).optional().describe("Volume 0-1 (default: 0.15)"),
							loop: z.boolean().optional().describe("Loop the audio (default: true)"),
							fade_in: z.number().min(0).optional().describe("Fade-in duration in seconds"),
							fade_out: z.number().min(0).optional().describe("Fade-out duration in seconds"),
							start_time: z
								.number()
								.min(0)
								.optional()
								.describe("Start playback at this time in seconds"),
							end_time: z
								.number()
								.min(0)
								.optional()
								.describe("End playback at this time in seconds"),
						}),
					)
					.describe("Array of BGM entries"),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async ({ file_path, bgm }) => {
			try {
				const presentation = readPresentation(file_path)
				const playback = presentation.playback ?? createDefaultPlayerConfig()

				playback.bgm = bgm.map((b) => ({
					src: b.src,
					volume: b.volume ?? 0.15,
					loop: b.loop ?? true,
					fadeIn: b.fade_in ?? 0,
					fadeOut: b.fade_out ?? 0,
					...(b.start_time !== undefined ? { startTime: b.start_time } : {}),
					...(b.end_time !== undefined ? { endTime: b.end_time } : {}),
				}))

				presentation.playback = playback
				writePresentation(file_path, presentation)
				return ok(JSON.stringify({ bgm: playback.bgm }, null, 2))
			} catch (e) {
				return err(`Error setting BGM: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)
}
