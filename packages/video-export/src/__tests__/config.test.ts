import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { loadVideoConfig, parseVideoConfig } from "../config"

describe("parseVideoConfig", () => {
	test("parses valid config", () => {
		const result = parseVideoConfig({
			input: "presentation.slide.json",
			fps: 30,
			defaultSlideDuration: 5,
			slides: [],
		})
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.input).toBe("presentation.slide.json")
			expect(result.data.fps).toBe(30)
			expect(result.data.defaultSlideDuration).toBe(5)
		}
	})

	test("applies defaults for optional fields", () => {
		const result = parseVideoConfig({ input: "test.slide.json" })
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.fps).toBe(30)
			expect(result.data.defaultSlideDuration).toBe(5)
			expect(result.data.slides).toEqual([])
			expect(result.data.bgm).toEqual([])
		}
	})

	test("fails on missing input", () => {
		const result = parseVideoConfig({ fps: 30 })
		expect(result.success).toBe(false)
	})

	test("fails on invalid fps", () => {
		const result = parseVideoConfig({ input: "test.json", fps: 0 })
		expect(result.success).toBe(false)
	})

	test("fails on invalid speaker value in voicevox", () => {
		const result = parseVideoConfig({
			input: "test.json",
			voicevox: { speaker: -1 },
		})
		expect(result.success).toBe(false)
	})

	test("parses voicevox config with defaults", () => {
		const result = parseVideoConfig({
			input: "test.json",
			voicevox: {},
		})
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.voicevox?.url).toBe("http://localhost:50021")
			expect(result.data.voicevox?.speaker).toBe(3)
			expect(result.data.voicevox?.speed).toBe(1.0)
		}
	})

	test("allows both narration and audioFile in slide config", () => {
		const result = parseVideoConfig({
			input: "test.json",
			slides: [
				{
					slideIndex: 0,
					narration: "ナレーション",
					audioFile: "audio.wav",
					duration: null,
				},
			],
		})
		expect(result.success).toBe(true)
	})

	test("parses bgm config with slide range", () => {
		const result = parseVideoConfig({
			input: "test.json",
			bgm: [{ src: "bgm.mp3", fromSlide: 0, toSlide: 5 }],
		})
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.bgm).toHaveLength(1)
		}
	})

	test("parses bgm config with time range", () => {
		const result = parseVideoConfig({
			input: "test.json",
			bgm: [{ src: "bgm.mp3", fromTime: 0, toTime: 30 }],
		})
		expect(result.success).toBe(true)
	})
})

describe("loadVideoConfig", () => {
	let tmpDir: string

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "slidini-test-"))
	})

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true })
	})

	test("loads valid config from file", () => {
		const configPath = path.join(tmpDir, "test.video.json")
		fs.writeFileSync(configPath, JSON.stringify({ input: "presentation.slide.json" }))
		const config = loadVideoConfig(configPath)
		expect(config.input).toBe("presentation.slide.json")
		expect(config.fps).toBe(30)
	})

	test("throws on nonexistent file", () => {
		expect(() => loadVideoConfig("/nonexistent/path.json")).toThrow()
	})
})
