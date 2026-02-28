import { describe, expect, test } from "bun:test"
import { createDefaultPresentation } from "../defaults"
import { parsePresentation, presentationSchema } from "../schema"

describe("parsePresentation", () => {
	test("parses valid presentation data", () => {
		const pres = createDefaultPresentation()
		const result = parsePresentation(pres)
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.meta.schemaVersion).toBe(1)
			expect(result.data.slides).toHaveLength(1)
		}
	})

	test("fails on invalid data", () => {
		const result = parsePresentation({ invalid: true })
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues.length).toBeGreaterThan(0)
		}
	})

	test("fails on missing required fields", () => {
		const result = parsePresentation({ meta: {}, slides: [] })
		expect(result.success).toBe(false)
	})

	test("fails on invalid animation type", () => {
		const pres = createDefaultPresentation()
		const slide = pres.slides[0]
		const element = slide?.elements[0]
		if (element) {
			element.animations = [
				{
					type: "invalid-animation" as never,
					duration: 0.5,
					delay: 0,
					easing: "ease-out",
					trigger: "onEnter",
					stepIndex: 0,
				},
			]
		}
		const result = parsePresentation(pres)
		expect(result.success).toBe(false)
	})

	test("fails on invalid transition type", () => {
		const pres = createDefaultPresentation()
		const slide = pres.slides[0]
		if (slide) {
			slide.transition.type = "invalid-transition" as never
		}
		const result = parsePresentation(pres)
		expect(result.success).toBe(false)
	})

	test("validates presentation with overlay elements", () => {
		const pres = createDefaultPresentation()
		const presWithOverlay = {
			...pres,
			overlayBackgroundElements: [
				{
					id: "overlay-1",
					type: "text" as const,
					position: { x: 0, y: 0 },
					size: { width: 100, height: 50 },
					rotation: 0,
					opacity: 1,
					zIndex: 1,
					content: "Overlay",
					style: {
						color: "#fff",
						fontSize: 16,
						fontFamily: "Noto Sans JP",
						fontWeight: "normal" as const,
						fontStyle: "normal" as const,
						textDecoration: "none" as const,
						textAlign: "left" as const,
						lineHeight: 1.5,
						backgroundColor: null,
						padding: 0,
					},
					animations: [],
				},
			],
		}
		const result = parsePresentation(presWithOverlay)
		expect(result.success).toBe(true)
	})
})

describe("presentationSchema", () => {
	test("validates directly via Zod schema", () => {
		const pres = createDefaultPresentation()
		const result = presentationSchema.safeParse(pres)
		expect(result.success).toBe(true)
	})

	test("rejects null input", () => {
		const result = presentationSchema.safeParse(null)
		expect(result.success).toBe(false)
	})
})
