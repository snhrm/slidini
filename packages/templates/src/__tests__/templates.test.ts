import { describe, expect, test } from "bun:test"
import type { ColorSetColors } from "@slidini/core"
import { SLIDE_TEMPLATES, createSlideFromTemplate, getSlideTemplate } from "../index"

describe("SLIDE_TEMPLATES", () => {
	test("contains 15 templates", () => {
		expect(SLIDE_TEMPLATES).toHaveLength(15)
	})

	test("each template has id, name, and slide data", () => {
		for (const t of SLIDE_TEMPLATES) {
			expect(t.id).toBeDefined()
			expect(typeof t.id).toBe("string")
			expect(t.name).toBeDefined()
			expect(typeof t.name).toBe("string")
			expect(t.slide).toBeDefined()
			expect(t.slide.background).toBeDefined()
			expect(t.slide.transition).toBeDefined()
			expect(t.slide.elements).toBeDefined()
		}
	})

	test("each template has a unique id", () => {
		const ids = SLIDE_TEMPLATES.map((t) => t.id)
		expect(new Set(ids).size).toBe(ids.length)
	})

	test("each template has description and category", () => {
		for (const t of SLIDE_TEMPLATES) {
			expect(t.description).toBeDefined()
			expect(["basic", "content", "media"]).toContain(t.category)
		}
	})
})

describe("getSlideTemplate", () => {
	test("returns template for valid id", () => {
		const t = getSlideTemplate("title")
		expect(t).toBeDefined()
		expect(t?.id).toBe("title")
	})

	test("returns undefined for invalid id", () => {
		const t = getSlideTemplate("nonexistent")
		expect(t).toBeUndefined()
	})
})

describe("createSlideFromTemplate", () => {
	test("creates a slide with generated id and elements", () => {
		const template = getSlideTemplate("title")
		expect(template).toBeDefined()
		const slide = createSlideFromTemplate(template as NonNullable<typeof template>)
		expect(slide.id).toMatch(/^slide-/)
		expect(slide.background).toBeDefined()
		expect(slide.transition).toBeDefined()
		expect(slide.elements.length).toBe(template?.slide.elements.length)
	})

	test("generates unique element ids", () => {
		const template = getSlideTemplate("title-body")
		expect(template).toBeDefined()
		const slide = createSlideFromTemplate(template as NonNullable<typeof template>)
		const ids = slide.elements.map((e) => e.id)
		expect(new Set(ids).size).toBe(ids.length)
	})

	test("applies color set when provided", () => {
		const template = getSlideTemplate("title")
		expect(template).toBeDefined()
		const colors: ColorSetColors = {
			background: "#ff0000",
			surface: "#00ff00",
			textPrimary: "#0000ff",
			textSecondary: "#ffff00",
			textMuted: "#ff00ff",
			accent: "#00ffff",
			accentSecondary: "#ffffff",
		}
		const slide = createSlideFromTemplate(template as NonNullable<typeof template>, colors)

		if (slide.background.type === "color") {
			expect(Object.values(colors)).toContain(slide.background.value)
		}
	})

	test("creates deep copy independent of template", () => {
		const template = getSlideTemplate("title")
		expect(template).toBeDefined()
		const slide1 = createSlideFromTemplate(template as NonNullable<typeof template>)
		const slide2 = createSlideFromTemplate(template as NonNullable<typeof template>)
		expect(slide1.id).not.toBe(slide2.id)
	})
})
