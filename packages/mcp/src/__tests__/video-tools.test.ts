import { afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { createDefaultPresentation } from "@slidini/core"
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

function writeSlideJson(filePath: string): void {
	const absPath = path.join(tmpDir, "projects", filePath)
	fs.mkdirSync(path.dirname(absPath), { recursive: true })
	const pres = createDefaultPresentation()
	fs.writeFileSync(absPath, JSON.stringify(pres, null, 2), "utf-8")
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
	test("creates playback config in slide.json", async () => {
		writeSlideJson("test/test.slide.json")
		const result = await callTool("slide_create_video_config", {
			file_path: "test/test.slide.json",
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as { defaultSlideDuration: number; defaultStepDelay: number }
		expect(data.defaultSlideDuration).toBe(5)
		expect(data.defaultStepDelay).toBe(1)
	})

	test("creates with custom duration and step delay", async () => {
		writeSlideJson("custom/custom.slide.json")
		const result = await callTool("slide_create_video_config", {
			file_path: "custom/custom.slide.json",
			default_slide_duration: 3,
			default_step_delay: 0.5,
		})
		const data = parseToolText(result) as {
			defaultSlideDuration: number
			defaultStepDelay: number
		}
		expect(data.defaultSlideDuration).toBe(3)
		expect(data.defaultStepDelay).toBe(0.5)
	})
})

describe("slide_read_video_config", () => {
	test("reads playback config from slide.json", async () => {
		writeSlideJson("read/read.slide.json")
		await callTool("slide_create_video_config", {
			file_path: "read/read.slide.json",
		})
		const result = await callTool("slide_read_video_config", {
			file_path: "read/read.slide.json",
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as { defaultSlideDuration: number }
		expect(data.defaultSlideDuration).toBe(5)
	})

	test("returns null for slide.json without playback", async () => {
		writeSlideJson("no-pb/no-pb.slide.json")
		const result = await callTool("slide_read_video_config", {
			file_path: "no-pb/no-pb.slide.json",
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result)
		expect(data).toBeNull()
	})

	test("returns error for nonexistent file", async () => {
		const result = await callTool("slide_read_video_config", {
			file_path: "nonexistent.slide.json",
		})
		expect(result.isError).toBe(true)
	})
})

describe("slide_update_video_config", () => {
	test("updates basic config fields", async () => {
		writeSlideJson("upd/upd.slide.json")
		await callTool("slide_create_video_config", {
			file_path: "upd/upd.slide.json",
		})
		const result = await callTool("slide_update_video_config", {
			file_path: "upd/upd.slide.json",
			default_slide_duration: 10,
			default_step_delay: 2,
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as {
			defaultSlideDuration: number
			defaultStepDelay: number
		}
		expect(data.defaultSlideDuration).toBe(10)
		expect(data.defaultStepDelay).toBe(2)
	})

	test("creates playback config if not present", async () => {
		writeSlideJson("new-pb/new-pb.slide.json")
		const result = await callTool("slide_update_video_config", {
			file_path: "new-pb/new-pb.slide.json",
			default_slide_duration: 8,
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as { defaultSlideDuration: number }
		expect(data.defaultSlideDuration).toBe(8)
	})
})

describe("slide_set_slide_narration", () => {
	test("sets narration for a slide", async () => {
		writeSlideJson("nar/nar.slide.json")
		const result = await callTool("slide_set_slide_narration", {
			file_path: "nar/nar.slide.json",
			slide_index: 0,
			narration: "こんにちは、これはテストです",
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as { slideIndex: number; narration: string }
		expect(data.slideIndex).toBe(0)
		expect(data.narration).toBe("こんにちは、これはテストです")
	})

	test("overwrites existing narration for same slide", async () => {
		writeSlideJson("nar2/nar2.slide.json")
		await callTool("slide_set_slide_narration", {
			file_path: "nar2/nar2.slide.json",
			slide_index: 0,
			narration: "First",
		})
		await callTool("slide_set_slide_narration", {
			file_path: "nar2/nar2.slide.json",
			slide_index: 0,
			narration: "Second",
		})

		const readResult = await callTool("slide_read_video_config", {
			file_path: "nar2/nar2.slide.json",
		})
		const data = parseToolText(readResult) as {
			slides: Array<{ narration: string }>
		}
		expect(data.slides).toHaveLength(1)
		expect(data.slides[0]?.narration).toBe("Second")
	})

	test("returns error when both narration and audio_file provided", async () => {
		writeSlideJson("nar-err/nar-err.slide.json")
		const result = await callTool("slide_set_slide_narration", {
			file_path: "nar-err/nar-err.slide.json",
			slide_index: 0,
			narration: "text",
			audio_file: "audio.wav",
		})
		expect(result.isError).toBe(true)
	})
})

describe("slide_set_bgm", () => {
	test("sets bgm array", async () => {
		writeSlideJson("bgm/bgm.slide.json")
		const result = await callTool("slide_set_bgm", {
			file_path: "bgm/bgm.slide.json",
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

	test("sets bgm with start_time and end_time", async () => {
		writeSlideJson("bgm-time/bgm-time.slide.json")
		const result = await callTool("slide_set_bgm", {
			file_path: "bgm-time/bgm-time.slide.json",
			bgm: [{ src: "bgm.mp3", start_time: 5, end_time: 30 }],
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as {
			bgm: Array<{ src: string; startTime: number; endTime: number }>
		}
		expect(data.bgm).toHaveLength(1)
		expect(data.bgm[0]?.startTime).toBe(5)
		expect(data.bgm[0]?.endTime).toBe(30)
	})

	test("omits startTime/endTime when not provided", async () => {
		writeSlideJson("bgm-no-time/bgm-no-time.slide.json")
		const result = await callTool("slide_set_bgm", {
			file_path: "bgm-no-time/bgm-no-time.slide.json",
			bgm: [{ src: "bgm.mp3" }],
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as {
			bgm: Array<{ src: string; startTime?: number; endTime?: number }>
		}
		expect(data.bgm).toHaveLength(1)
		expect(data.bgm[0]?.startTime).toBeUndefined()
		expect(data.bgm[0]?.endTime).toBeUndefined()
	})
})
