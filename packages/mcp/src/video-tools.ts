import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { type VideoConfig, parseVideoConfig } from "@slidini/video-export/src/config"
import { z } from "zod"
import { err, ok, resolveVideoFile } from "./index"

function readVideoConfig(filePath: string): VideoConfig {
	const absPath = resolveVideoFile(filePath)
	const raw = readFileSync(absPath, "utf-8")
	const data = JSON.parse(raw)
	const result = parseVideoConfig(data)
	if (!result.success) {
		throw new Error(`Invalid video config: ${result.error.issues.map((i) => i.message).join(", ")}`)
	}
	return result.data
}

function writeVideoConfig(filePath: string, config: VideoConfig): void {
	const absPath = resolveVideoFile(filePath)
	mkdirSync(dirname(absPath), { recursive: true })
	writeFileSync(absPath, `${JSON.stringify(config, null, "\t")}\n`, "utf-8")
}

export function registerVideoTools(server: McpServer): void {
	// ----- slide_create_video_config -----

	server.registerTool(
		"slide_create_video_config",
		{
			title: "Create Video Config",
			description: `Create a new .video.json file for video export configuration.

Args:
  - file_path (string): Path to the .video.json file to create
  - input (string): Path to the source .slide.json file (relative to .video.json)
  - fps (number, optional): Frames per second (default: 30)
  - default_slide_duration (number, optional): Default duration per slide in seconds (default: 5)

Returns: JSON summary of the created config.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .video.json file to create"),
				input: z.string().describe("Path to the source .slide.json file"),
				fps: z.number().int().min(1).optional().describe("Frames per second (default: 30)"),
				default_slide_duration: z
					.number()
					.min(0)
					.optional()
					.describe("Default slide duration in seconds (default: 5)"),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false,
			},
		},
		async ({ file_path, input, fps, default_slide_duration }) => {
			try {
				const config: VideoConfig = {
					input,
					fps: fps ?? 30,
					defaultSlideDuration: default_slide_duration ?? 5,
					slides: [],
					bgm: [],
				}
				writeVideoConfig(file_path, config)
				return ok(
					JSON.stringify(
						{
							file: resolveVideoFile(file_path),
							input: config.input,
							fps: config.fps,
							defaultSlideDuration: config.defaultSlideDuration,
						},
						null,
						2,
					),
				)
			} catch (e) {
				return err(`Error creating video config: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_read_video_config -----

	server.registerTool(
		"slide_read_video_config",
		{
			title: "Read Video Config",
			description: `Read a .video.json file and return its full content.

Args:
  - file_path (string): Path to the .video.json file

Returns: Full video config JSON.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .video.json file"),
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
				const config = readVideoConfig(file_path)
				return ok(JSON.stringify(config, null, 2))
			} catch (e) {
				return err(`Error reading video config: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_update_video_config -----

	server.registerTool(
		"slide_update_video_config",
		{
			title: "Update Video Config",
			description: `Update top-level settings of a .video.json file. Only provided fields are updated.

Args:
  - file_path (string): Path to the .video.json file
  - input (string, optional): New source .slide.json path
  - fps (number, optional): Frames per second
  - default_slide_duration (number, optional): Default slide duration in seconds
  - voicevox_url (string, optional): VOICEVOX server URL
  - voicevox_speaker (number, optional): VOICEVOX speaker ID
  - voicevox_speed (number, optional): VOICEVOX speech speed

Returns: Updated config summary.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .video.json file"),
				input: z.string().optional().describe("New source .slide.json path"),
				fps: z.number().int().min(1).optional().describe("Frames per second"),
				default_slide_duration: z
					.number()
					.min(0)
					.optional()
					.describe("Default slide duration in seconds"),
				voicevox_url: z.string().optional().describe("VOICEVOX server URL"),
				voicevox_speaker: z.number().int().min(0).optional().describe("VOICEVOX speaker ID"),
				voicevox_speed: z.number().min(0.1).max(5).optional().describe("VOICEVOX speech speed"),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async ({
			file_path,
			input,
			fps,
			default_slide_duration,
			voicevox_url,
			voicevox_speaker,
			voicevox_speed,
		}) => {
			try {
				const config = readVideoConfig(file_path)
				if (input !== undefined) config.input = input
				if (fps !== undefined) config.fps = fps
				if (default_slide_duration !== undefined)
					config.defaultSlideDuration = default_slide_duration

				if (
					voicevox_url !== undefined ||
					voicevox_speaker !== undefined ||
					voicevox_speed !== undefined
				) {
					if (!config.voicevox) {
						config.voicevox = { url: "http://localhost:50021", speaker: 8, speed: 1.2 }
					}
					if (voicevox_url !== undefined) config.voicevox.url = voicevox_url
					if (voicevox_speaker !== undefined) config.voicevox.speaker = voicevox_speaker
					if (voicevox_speed !== undefined) config.voicevox.speed = voicevox_speed
				}

				writeVideoConfig(file_path, config)
				return ok(
					JSON.stringify(
						{
							input: config.input,
							fps: config.fps,
							defaultSlideDuration: config.defaultSlideDuration,
							voicevox: config.voicevox ?? null,
						},
						null,
						2,
					),
				)
			} catch (e) {
				return err(`Error updating video config: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_set_slide_narration -----

	server.registerTool(
		"slide_set_slide_narration",
		{
			title: "Set Slide Narration",
			description: `Set narration for a specific slide in the video config. Overwrites existing entry for the slide index, or adds a new one.

Args:
  - file_path (string): Path to the .video.json file
  - slide_index (number): 0-based slide index
  - narration (string, optional): Narration text (mutually exclusive with audio_file)
  - audio_file (string, optional): Path to audio file (mutually exclusive with narration)
  - duration (number|null, optional): Override slide duration in seconds (null = auto)

Returns: The updated slide config entry.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .video.json file"),
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
				const config = readVideoConfig(file_path)
				const existing = config.slides.findIndex((s) => s.slideIndex === slide_index)

				const entry = {
					slideIndex: slide_index,
					...(narration !== undefined ? { narration } : {}),
					...(audio_file !== undefined ? { audioFile: audio_file } : {}),
					duration: duration !== undefined ? duration : null,
				}

				if (existing >= 0) {
					config.slides[existing] = entry
				} else {
					config.slides.push(entry)
				}

				writeVideoConfig(file_path, config)
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
			description: `Set the BGM (background music) array for the video config. Replaces the entire bgm array.

Args:
  - file_path (string): Path to the .video.json file
  - bgm (array): Array of BGM entries, each with:
    - src (string): Path to the audio file
    - volume (number, optional): Volume 0-1 (default: 0.15)
    - loop (boolean, optional): Loop the audio (default: true)
    - fade_in (number, optional): Fade-in duration in seconds (default: 0)
    - fade_out (number, optional): Fade-out duration in seconds (default: 0)
    - from_slide (number, optional): Start from this slide index
    - to_slide (number, optional): End at this slide index
    - from_time (number, optional): Start from this time in seconds
    - to_time (number, optional): End at this time in seconds

Returns: The updated bgm array.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .video.json file"),
				bgm: z
					.array(
						z.object({
							src: z.string().describe("Path to the audio file"),
							volume: z.number().min(0).max(1).optional().describe("Volume 0-1 (default: 0.3)"),
							loop: z.boolean().optional().describe("Loop the audio (default: true)"),
							fade_in: z.number().min(0).optional().describe("Fade-in duration in seconds"),
							fade_out: z.number().min(0).optional().describe("Fade-out duration in seconds"),
							from_slide: z
								.number()
								.int()
								.min(0)
								.optional()
								.describe("Start from this slide index"),
							to_slide: z.number().int().min(0).optional().describe("End at this slide index"),
							from_time: z.number().min(0).optional().describe("Start from this time in seconds"),
							to_time: z.number().min(0).optional().describe("End at this time in seconds"),
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
				const config = readVideoConfig(file_path)
				config.bgm = bgm.map((b) => ({
					src: b.src,
					volume: b.volume ?? 0.3,
					loop: b.loop ?? true,
					fadeIn: b.fade_in ?? 0,
					fadeOut: b.fade_out ?? 0,
					...(b.from_slide !== undefined ? { fromSlide: b.from_slide } : {}),
					...(b.to_slide !== undefined ? { toSlide: b.to_slide } : {}),
					...(b.from_time !== undefined ? { fromTime: b.from_time } : {}),
					...(b.to_time !== undefined ? { toTime: b.to_time } : {}),
				}))
				writeVideoConfig(file_path, config)
				return ok(JSON.stringify({ bgm: config.bgm }, null, 2))
			} catch (e) {
				return err(`Error setting BGM: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)
}
