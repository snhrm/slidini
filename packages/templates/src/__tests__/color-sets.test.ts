import { describe, expect, test } from "bun:test"
import type { ColorSetColors, Slide } from "@slidini/core"
import {
	DEFAULT_COLOR_SET_COLORS,
	createDefaultSlide,
	createDefaultTextElement,
} from "@slidini/core"
import {
	COLOR_SETS,
	applyColorSetToSlide,
	getColorSet,
	getColorSetColors,
	resolveOldColors,
} from "../color-sets"

describe("COLOR_SETS", () => {
	test("contains 10 color sets", () => {
		expect(COLOR_SETS).toHaveLength(10)
	})

	test("each set has id, name, and colors", () => {
		for (const cs of COLOR_SETS) {
			expect(cs.id).toBeDefined()
			expect(typeof cs.id).toBe("string")
			expect(cs.name).toBeDefined()
			expect(typeof cs.name).toBe("string")
			expect(cs.colors).toBeDefined()
			expect(cs.colors.background).toBeDefined()
			expect(cs.colors.surface).toBeDefined()
			expect(cs.colors.textPrimary).toBeDefined()
			expect(cs.colors.textSecondary).toBeDefined()
			expect(cs.colors.textMuted).toBeDefined()
			expect(cs.colors.accent).toBeDefined()
			expect(cs.colors.accentSecondary).toBeDefined()
		}
	})

	test("each color set has a unique id", () => {
		const ids = COLOR_SETS.map((cs) => cs.id)
		expect(new Set(ids).size).toBe(ids.length)
	})
})

describe("getColorSet", () => {
	test("returns color set for valid id", () => {
		const cs = getColorSet("dark-slate")
		expect(cs).toBeDefined()
		expect(cs?.id).toBe("dark-slate")
	})

	test("returns undefined for invalid id", () => {
		expect(getColorSet("nonexistent")).toBeUndefined()
	})
})

describe("getColorSetColors", () => {
	test("returns colors for valid id", () => {
		const colors = getColorSetColors("dark-slate")
		expect(colors).toBeDefined()
		expect(colors?.background).toBeDefined()
	})

	test("returns undefined for invalid id", () => {
		expect(getColorSetColors("nonexistent")).toBeUndefined()
	})
})

describe("applyColorSetToSlide", () => {
	test("replaces background color", () => {
		const oldColors: ColorSetColors = {
			background: "#111111",
			surface: "#222222",
			textPrimary: "#ffffff",
			textSecondary: "#cccccc",
			textMuted: "#888888",
			accent: "#0000ff",
			accentSecondary: "#ff00ff",
		}
		const slide = createDefaultSlide({
			background: { type: "color", value: "#111111" },
		})

		const newColors: ColorSetColors = {
			...oldColors,
			background: "#ff0000",
		}

		const updated = applyColorSetToSlide(slide, oldColors, newColors)
		if (updated.background.type === "color") {
			expect(updated.background.value).toBe("#ff0000")
		}
	})

	test("replaces text element color", () => {
		const oldColors: ColorSetColors = {
			background: "#111111",
			surface: "#222222",
			textPrimary: "#ffffff",
			textSecondary: "#cccccc",
			textMuted: "#888888",
			accent: "#0000ff",
			accentSecondary: "#ff00ff",
		}
		const textEl = createDefaultTextElement()
		textEl.style.color = "#ffffff"
		const slide = createDefaultSlide({ elements: [textEl] })

		const newColors: ColorSetColors = {
			...oldColors,
			textPrimary: "#00ff00",
		}

		const updated = applyColorSetToSlide(slide, oldColors, newColors)
		const el = updated.elements[0]
		if (el?.type === "text") {
			expect(el.style.color).toBe("#00ff00")
		}
	})

	test("does not modify original slide", () => {
		const slide = createDefaultSlide({
			background: { type: "color", value: "#111111" },
		})

		const oldColors: ColorSetColors = {
			background: "#111111",
			surface: "#222222",
			textPrimary: "#ffffff",
			textSecondary: "#cccccc",
			textMuted: "#888888",
			accent: "#0000ff",
			accentSecondary: "#ff00ff",
		}

		applyColorSetToSlide(slide, oldColors, {
			...oldColors,
			background: "#ff0000",
		})

		if (slide.background.type === "color") {
			expect(slide.background.value).toBe("#111111")
		}
	})

	test("replaces gradient stop colors", () => {
		const slide: Slide = createDefaultSlide({
			background: {
				type: "gradient",
				gradient: {
					kind: "linear",
					angle: 135,
					stops: [
						{ color: "#6366f1", position: 0 },
						{ color: "#ec4899", position: 100 },
					],
				},
			},
		})

		const oldColors: ColorSetColors = {
			...DEFAULT_COLOR_SET_COLORS,
			accent: "#6366f1",
			accentSecondary: "#ec4899",
		}
		const newColors: ColorSetColors = {
			...DEFAULT_COLOR_SET_COLORS,
			accent: "#aa0000",
			accentSecondary: "#bb0000",
		}

		const updated = applyColorSetToSlide(slide, oldColors, newColors)
		if (updated.background.type === "gradient") {
			expect(updated.background.gradient.stops[0]?.color).toBe("#aa0000")
			expect(updated.background.gradient.stops[1]?.color).toBe("#bb0000")
		}
	})
})

describe("resolveOldColors", () => {
	test("returns DEFAULT_COLOR_SET_COLORS when no ids provided", () => {
		const colors = resolveOldColors(null, null)
		expect(colors).toEqual(DEFAULT_COLOR_SET_COLORS)
	})

	test("prefers slideColorSetId over metaColorSetId", () => {
		const colors = resolveOldColors("dark-slate", "light-clean")
		const expected = getColorSetColors("light-clean")
		expect(colors).toEqual(expected)
	})

	test("falls back to metaColorSetId when slideColorSetId is null", () => {
		const colors = resolveOldColors("dark-slate", null)
		const expected = getColorSetColors("dark-slate")
		expect(colors).toEqual(expected)
	})

	test("returns defaults for unknown id", () => {
		const colors = resolveOldColors("nonexistent", null)
		expect(colors).toEqual(DEFAULT_COLOR_SET_COLORS)
	})
})
