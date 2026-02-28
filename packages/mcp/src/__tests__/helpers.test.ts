import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { createDefaultPresentation } from "@slidini/core"
import {
	err,
	findSlide,
	findSlideByIndex,
	ok,
	readPresentation,
	resolveProjectFile,
	writePresentation,
} from "../index"

describe("resolveProjectFile", () => {
	test("resolves relative path to projects/ directory", () => {
		const result = resolveProjectFile("test/file.slide.json")
		expect(result).toContain("projects")
		expect(result).toContain("test/file.slide.json")
	})

	test("returns absolute path as-is", () => {
		const abs = "/absolute/path/file.slide.json"
		expect(resolveProjectFile(abs)).toBe(abs)
	})
})

describe("ok", () => {
	test("returns text content response", () => {
		const response = ok("Success message")
		expect(response.content).toHaveLength(1)
		expect(response.content[0]?.type).toBe("text")
		expect(response.content[0]?.text).toBe("Success message")
	})

	test("does not include isError", () => {
		const response = ok("test")
		expect(response).not.toHaveProperty("isError")
	})
})

describe("err", () => {
	test("returns error response with isError: true", () => {
		const response = err("Error message")
		expect(response.content).toHaveLength(1)
		expect(response.content[0]?.type).toBe("text")
		expect(response.content[0]?.text).toBe("Error message")
		expect(response.isError).toBe(true)
	})
})

describe("readPresentation / writePresentation", () => {
	let tmpDir: string

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "slidini-mcp-test-"))
	})

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true })
	})

	test("writes and reads back a presentation", () => {
		const pres = createDefaultPresentation()
		const filePath = path.join(tmpDir, "test.slide.json")
		writePresentation(filePath, pres)
		const loaded = readPresentation(filePath)
		expect(loaded.meta.schemaVersion).toBe(1)
		expect(loaded.slides).toHaveLength(1)
	})

	test("writePresentation updates updatedAt", () => {
		const pres = createDefaultPresentation()
		const originalUpdatedAt = pres.meta.updatedAt
		const filePath = path.join(tmpDir, "test.slide.json")

		// Small delay to ensure different timestamp
		const before = Date.now()
		writePresentation(filePath, pres)
		const loaded = readPresentation(filePath)

		expect(new Date(loaded.meta.updatedAt).getTime()).toBeGreaterThanOrEqual(before)
	})

	test("writePresentation creates directories", () => {
		const pres = createDefaultPresentation()
		const filePath = path.join(tmpDir, "nested", "dir", "test.slide.json")
		writePresentation(filePath, pres)
		expect(fs.existsSync(filePath)).toBe(true)
	})

	test("readPresentation throws on invalid file", () => {
		const filePath = path.join(tmpDir, "invalid.json")
		fs.writeFileSync(filePath, JSON.stringify({ invalid: true }))
		expect(() => readPresentation(filePath)).toThrow("Invalid presentation file")
	})
})

describe("findSlide", () => {
	test("finds slide by id", () => {
		const pres = createDefaultPresentation()
		const slideId = pres.slides[0]?.id
		const slide = findSlide(pres, slideId)
		expect(slide.id).toBe(slideId)
	})

	test("throws when slide not found", () => {
		const pres = createDefaultPresentation()
		expect(() => findSlide(pres, "nonexistent")).toThrow("Slide not found")
	})
})

describe("findSlideByIndex", () => {
	test("finds slide by index", () => {
		const pres = createDefaultPresentation()
		const slide = findSlideByIndex(pres, 0)
		expect(slide.id).toBe(pres.slides[0]?.id)
	})

	test("throws when index out of range", () => {
		const pres = createDefaultPresentation()
		expect(() => findSlideByIndex(pres, 99)).toThrow("Slide index out of range")
	})
})
