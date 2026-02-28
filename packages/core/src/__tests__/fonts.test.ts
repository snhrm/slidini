import { describe, expect, test } from "bun:test"
import type { FontCategory } from "../fonts"
import { AVAILABLE_FONTS } from "../fonts"

describe("AVAILABLE_FONTS", () => {
	test("is a non-empty array", () => {
		expect(AVAILABLE_FONTS.length).toBeGreaterThan(0)
	})

	test("all elements have family and category", () => {
		for (const font of AVAILABLE_FONTS) {
			expect(font.family).toBeDefined()
			expect(typeof font.family).toBe("string")
			expect(font.family.length).toBeGreaterThan(0)
			expect(font.category).toBeDefined()
		}
	})

	test("contains fonts from each category", () => {
		const categories: FontCategory[] = ["ゴシック体", "明朝体", "見出し・デザイン向き"]
		for (const cat of categories) {
			const fonts = AVAILABLE_FONTS.filter((f) => f.category === cat)
			expect(fonts.length).toBeGreaterThan(0)
		}
	})

	test("contains Noto Sans JP", () => {
		const noto = AVAILABLE_FONTS.find((f) => f.family === "Noto Sans JP")
		expect(noto).toBeDefined()
		expect(noto?.category).toBe("ゴシック体")
	})
})
