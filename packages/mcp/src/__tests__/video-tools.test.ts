import { afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { registerVideoTools } from "../video-tools"

let client: Client
let tmpDir: string
let originalCwd: string

async function callTool(name: string, args: Record<string, unknown> = {}) {
	return await client.callTool({ name, arguments: args })
}

function parseToolText(result: Awaited<ReturnType<typeof callTool>>): unknown {
	const content = result.content as Array<{ type: string; text: string }>
	return JSON.parse(content[0]?.text ?? "{}")
}

beforeAll(async () => {
	const server = new McpServer({ name: "test-video", version: "0.0.1" })
	registerVideoTools(server)

	const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
	client = new Client({ name: "test-client", version: "0.0.1" })
	await Promise.all([client.connect(clientTransport), server.connect(serverTransport)])
})

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "slidini-video-tools-"))
	originalCwd = process.cwd()
	process.chdir(tmpDir)
	fs.mkdirSync("projects", { recursive: true })
})

afterEach(() => {
	process.chdir(originalCwd)
	fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe("slide_create_video_config", () => {
	test("creates a video config file", async () => {
		const result = await callTool("slide_create_video_config", {
			file_path: "test/test.video.json",
			input: "test.slide.json",
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as { input: string; fps: number }
		expect(data.input).toBe("test.slide.json")
		expect(data.fps).toBe(30)
		expect(fs.existsSync(path.join(tmpDir, "projects/test/test.video.json"))).toBe(true)
	})

	test("creates with custom fps and duration", async () => {
		const result = await callTool("slide_create_video_config", {
			file_path: "custom/custom.video.json",
			input: "custom.slide.json",
			fps: 60,
			default_slide_duration: 3,
		})
		const data = parseToolText(result) as {
			fps: number
			defaultSlideDuration: number
		}
		expect(data.fps).toBe(60)
		expect(data.defaultSlideDuration).toBe(3)
	})
})

describe("slide_read_video_config", () => {
	test("reads existing video config", async () => {
		await callTool("slide_create_video_config", {
			file_path: "read/read.video.json",
			input: "read.slide.json",
		})
		const result = await callTool("slide_read_video_config", {
			file_path: "read/read.video.json",
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as { input: string }
		expect(data.input).toBe("read.slide.json")
	})

	test("returns error for nonexistent file", async () => {
		const result = await callTool("slide_read_video_config", {
			file_path: "nonexistent.video.json",
		})
		expect(result.isError).toBe(true)
	})
})

describe("slide_update_video_config", () => {
	test("updates basic config fields", async () => {
		await callTool("slide_create_video_config", {
			file_path: "upd/upd.video.json",
			input: "upd.slide.json",
		})
		const result = await callTool("slide_update_video_config", {
			file_path: "upd/upd.video.json",
			fps: 60,
			default_slide_duration: 10,
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as { fps: number; defaultSlideDuration: number }
		expect(data.fps).toBe(60)
		expect(data.defaultSlideDuration).toBe(10)
	})

	test("updates voicevox config", async () => {
		await callTool("slide_create_video_config", {
			file_path: "vv/vv.video.json",
			input: "vv.slide.json",
		})
		const result = await callTool("slide_update_video_config", {
			file_path: "vv/vv.video.json",
			voicevox_speaker: 5,
			voicevox_speed: 1.5,
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as {
			voicevox: { speaker: number; speed: number }
		}
		expect(data.voicevox.speaker).toBe(5)
		expect(data.voicevox.speed).toBe(1.5)
	})
})

describe("slide_set_slide_narration", () => {
	test("sets narration for a slide", async () => {
		await callTool("slide_create_video_config", {
			file_path: "nar/nar.video.json",
			input: "nar.slide.json",
		})
		const result = await callTool("slide_set_slide_narration", {
			file_path: "nar/nar.video.json",
			slide_index: 0,
			narration: "こんにちは、これはテストです",
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as { slideIndex: number; narration: string }
		expect(data.slideIndex).toBe(0)
		expect(data.narration).toBe("こんにちは、これはテストです")
	})

	test("overwrites existing narration for same slide", async () => {
		await callTool("slide_create_video_config", {
			file_path: "nar2/nar2.video.json",
			input: "nar2.slide.json",
		})
		await callTool("slide_set_slide_narration", {
			file_path: "nar2/nar2.video.json",
			slide_index: 0,
			narration: "First",
		})
		await callTool("slide_set_slide_narration", {
			file_path: "nar2/nar2.video.json",
			slide_index: 0,
			narration: "Second",
		})

		const readResult = await callTool("slide_read_video_config", {
			file_path: "nar2/nar2.video.json",
		})
		const data = parseToolText(readResult) as {
			slides: Array<{ narration: string }>
		}
		expect(data.slides).toHaveLength(1)
		expect(data.slides[0]?.narration).toBe("Second")
	})

	test("returns error when both narration and audio_file provided", async () => {
		await callTool("slide_create_video_config", {
			file_path: "nar-err/nar-err.video.json",
			input: "nar-err.slide.json",
		})
		const result = await callTool("slide_set_slide_narration", {
			file_path: "nar-err/nar-err.video.json",
			slide_index: 0,
			narration: "text",
			audio_file: "audio.wav",
		})
		expect(result.isError).toBe(true)
	})
})

describe("slide_set_bgm", () => {
	test("sets bgm array", async () => {
		await callTool("slide_create_video_config", {
			file_path: "bgm/bgm.video.json",
			input: "bgm.slide.json",
		})
		const result = await callTool("slide_set_bgm", {
			file_path: "bgm/bgm.video.json",
			bgm: [{ src: "bgm.mp3", volume: 0.2, loop: true, fade_in: 2, fade_out: 2 }],
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as {
			bgm: Array<{ src: string; volume: number; fadeIn: number }>
		}
		expect(data.bgm).toHaveLength(1)
		expect(data.bgm[0]?.src).toBe("bgm.mp3")
		expect(data.bgm[0]?.volume).toBe(0.2)
		expect(data.bgm[0]?.fadeIn).toBe(2)
	})
})
