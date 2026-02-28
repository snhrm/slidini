import { describe, expect, test } from "bun:test"
import { generateId } from "../defaults"
import { buildGoogleFontsUrl } from "../fonts"

describe("generateId", () => {
	test("generates id with given prefix", () => {
		const id = generateId("text")
		expect(id).toMatch(/^text-\d+-[a-z0-9]+$/)
	})

	test("generates id with different prefix", () => {
		const id = generateId("slide")
		expect(id.startsWith("slide-")).toBe(true)
	})

	test("generates unique ids on consecutive calls", () => {
		const ids = new Set(Array.from({ length: 100 }, () => generateId("test")))
		expect(ids.size).toBe(100)
	})
})

describe("buildGoogleFontsUrl", () => {
	test("builds URL for a single font", () => {
		const url = buildGoogleFontsUrl(["Noto Sans JP"])
		expect(url).toBe("https://fonts.googleapis.com/css2?family=Noto+Sans+JP&display=swap")
	})

	test("builds URL for multiple fonts", () => {
		const url = buildGoogleFontsUrl(["Noto Sans JP", "M PLUS 1p"])
		expect(url).toBe(
			"https://fonts.googleapis.com/css2?family=Noto+Sans+JP&family=M+PLUS+1p&display=swap",
		)
	})

	test("replaces spaces with +", () => {
		const url = buildGoogleFontsUrl(["Zen Kaku Gothic New"])
		expect(url).toContain("family=Zen+Kaku+Gothic+New")
	})
})
