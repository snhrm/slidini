import { describe, expect, test } from "bun:test"
import { createDefaultAnimation } from "../animations"
import {
	createDefaultAutoplayConfig,
	createDefaultBackground,
	createDefaultChartElement,
	createDefaultChartStyle,
	createDefaultGradient,
	createDefaultImageElement,
	createDefaultMeta,
	createDefaultPresentation,
	createDefaultSlide,
	createDefaultTextElement,
	createDefaultTextStyle,
	createDefaultTransition,
	createDefaultVideoElement,
} from "../defaults"

describe("createDefaultMeta", () => {
	test("returns object with all required fields", () => {
		const meta = createDefaultMeta()
		expect(meta.schemaVersion).toBe(1)
		expect(meta.title).toBe("無題のプレゼンテーション")
		expect(meta.width).toBe(1920)
		expect(meta.height).toBe(1080)
		expect(meta.createdAt).toBeDefined()
		expect(meta.updatedAt).toBeDefined()
	})

	test("timestamps are ISO 8601 format", () => {
		const meta = createDefaultMeta()
		expect(() => new Date(meta.createdAt).toISOString()).not.toThrow()
		expect(meta.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
	})

	test("overrides values when provided", () => {
		const meta = createDefaultMeta({ title: "Custom Title", width: 3840 })
		expect(meta.title).toBe("Custom Title")
		expect(meta.width).toBe(3840)
		expect(meta.schemaVersion).toBe(1)
	})
})

describe("createDefaultBackground", () => {
	test("returns color background with default value", () => {
		const bg = createDefaultBackground()
		expect(bg.type).toBe("color")
		expect(bg).toHaveProperty("value", "#1e293b")
	})
})

describe("createDefaultGradient", () => {
	test("returns linear gradient with two stops", () => {
		const gradient = createDefaultGradient()
		expect(gradient.kind).toBe("linear")
		expect(gradient.angle).toBe(135)
		expect(gradient.stops).toHaveLength(2)
		expect(gradient.stops[0]?.position).toBe(0)
		expect(gradient.stops[1]?.position).toBe(100)
	})
})

describe("createDefaultTransition", () => {
	test("returns fade transition with default settings", () => {
		const transition = createDefaultTransition()
		expect(transition.type).toBe("fade")
		expect(transition.duration).toBe(0.5)
		expect(transition.easing).toBe("ease-out")
	})
})

describe("createDefaultTextStyle", () => {
	test("returns text style with all defaults", () => {
		const style = createDefaultTextStyle()
		expect(style.color).toBe("#ffffff")
		expect(style.fontSize).toBe(32)
		expect(style.fontFamily).toBe("Noto Sans JP")
		expect(style.fontWeight).toBe("normal")
		expect(style.fontStyle).toBe("normal")
		expect(style.textDecoration).toBe("none")
		expect(style.textAlign).toBe("left")
		expect(style.lineHeight).toBe(1.5)
		expect(style.backgroundColor).toBeNull()
		expect(style.padding).toBe(0)
	})

	test("overrides values when provided", () => {
		const style = createDefaultTextStyle({ fontSize: 64, textAlign: "center" })
		expect(style.fontSize).toBe(64)
		expect(style.textAlign).toBe("center")
		expect(style.color).toBe("#ffffff")
	})
})

describe("createDefaultTextElement", () => {
	test("returns text element with id, type, and defaults", () => {
		const el = createDefaultTextElement()
		expect(el.id).toMatch(/^text-/)
		expect(el.type).toBe("text")
		expect(el.content).toBe("テキストを入力")
		expect(el.position).toEqual({ x: 160, y: 340 })
		expect(el.size).toEqual({ width: 1600, height: 400 })
		expect(el.rotation).toBe(0)
		expect(el.opacity).toBe(1)
		expect(el.zIndex).toBe(1)
		expect(el.animations).toEqual([])
		expect(el.style).toBeDefined()
	})

	test("overrides values when provided", () => {
		const el = createDefaultTextElement({ content: "Hello", opacity: 0.5 })
		expect(el.content).toBe("Hello")
		expect(el.opacity).toBe(0.5)
	})
})

describe("createDefaultImageElement", () => {
	test("returns image element with defaults", () => {
		const el = createDefaultImageElement()
		expect(el.id).toMatch(/^img-/)
		expect(el.type).toBe("image")
		expect(el.src).toBe("")
		expect(el.fit).toBe("contain")
		expect(el.animations).toEqual([])
	})

	test("overrides values when provided", () => {
		const el = createDefaultImageElement({ src: "data:image/png;base64,test", fit: "cover" })
		expect(el.src).toBe("data:image/png;base64,test")
		expect(el.fit).toBe("cover")
	})
})

describe("createDefaultVideoElement", () => {
	test("returns video element with defaults", () => {
		const el = createDefaultVideoElement()
		expect(el.id).toMatch(/^video-/)
		expect(el.type).toBe("video")
		expect(el.src).toBe("")
		expect(el.autoplay).toBe(false)
		expect(el.loop).toBe(false)
		expect(el.muted).toBe(true)
	})
})

describe("createDefaultChartStyle", () => {
	test("returns chart style with all defaults", () => {
		const style = createDefaultChartStyle()
		expect(style.backgroundColor).toBeNull()
		expect(style.fontSize).toBe(14)
		expect(style.fontFamily).toBe("Noto Sans JP")
		expect(style.showLegend).toBe(true)
		expect(style.legendPosition).toBe("bottom")
		expect(style.showGrid).toBe(true)
		expect(style.stacked).toBe(false)
		expect(style.categoryColors).toHaveLength(8)
	})

	test("overrides values when provided", () => {
		const style = createDefaultChartStyle({ stacked: true, fontSize: 20 })
		expect(style.stacked).toBe(true)
		expect(style.fontSize).toBe(20)
	})
})

describe("createDefaultChartElement", () => {
	test("returns chart element with defaults", () => {
		const el = createDefaultChartElement()
		expect(el.id).toMatch(/^chart-/)
		expect(el.type).toBe("chart")
		expect(el.chartType).toBe("bar")
		expect(el.categories).toHaveLength(5)
		expect(el.series).toHaveLength(2)
		expect(el.style).toBeDefined()
		expect(el.animations).toEqual([])
	})

	test("overrides values when provided", () => {
		const el = createDefaultChartElement({ chartType: "pie" })
		expect(el.chartType).toBe("pie")
	})
})

describe("createDefaultSlide", () => {
	test("returns slide with generated id and defaults", () => {
		const slide = createDefaultSlide()
		expect(slide.id).toMatch(/^slide-/)
		expect(slide.background.type).toBe("color")
		expect(slide.transition.type).toBe("fade")
		expect(slide.elements).toEqual([])
	})

	test("overrides values when provided", () => {
		const slide = createDefaultSlide({ elements: [createDefaultTextElement()] })
		expect(slide.elements).toHaveLength(1)
	})
})

describe("createDefaultPresentation", () => {
	test("returns presentation with meta and one slide", () => {
		const pres = createDefaultPresentation()
		expect(pres.meta).toBeDefined()
		expect(pres.meta.schemaVersion).toBe(1)
		expect(pres.slides).toHaveLength(1)
		expect(pres.slides[0]?.elements).toHaveLength(1)
		expect(pres.slides[0]?.elements[0]?.type).toBe("text")
	})
})

describe("createDefaultAnimation", () => {
	test("returns fade-in animation by default", () => {
		const anim = createDefaultAnimation()
		expect(anim.type).toBe("fade-in")
		expect(anim.duration).toBe(0.5)
		expect(anim.delay).toBe(0)
		expect(anim.easing).toBe("ease-out")
		expect(anim.trigger).toBe("onEnter")
		expect(anim.stepIndex).toBe(0)
	})

	test("accepts custom animation type", () => {
		const anim = createDefaultAnimation("scale-in")
		expect(anim.type).toBe("scale-in")
	})
})

describe("createDefaultAutoplayConfig", () => {
	test("returns autoplay config with defaults", () => {
		const config = createDefaultAutoplayConfig()
		expect(config.interval).toBe(5)
		expect(config.loop).toBe(false)
	})
})
