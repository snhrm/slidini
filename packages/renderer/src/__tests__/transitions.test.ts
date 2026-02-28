import { describe, expect, test } from "bun:test"
import type { SlideTransitionType } from "@slidini/core"
import {
	getCubeTransformOrigin,
	is3DTransition,
	isSyncTransition,
} from "../hooks/useSlideTransition"

describe("is3DTransition", () => {
	test("returns true for cube and page-turn transitions", () => {
		const types3D: SlideTransitionType[] = [
			"cube-left",
			"cube-right",
			"cube-up",
			"cube-down",
			"page-turn",
		]
		for (const t of types3D) {
			expect(is3DTransition(t)).toBe(true)
		}
	})

	test("returns false for non-3D transitions", () => {
		const typesNon3D: SlideTransitionType[] = [
			"none",
			"fade",
			"slide-left",
			"slide-right",
			"zoom",
			"portal",
			"wipe-left",
		]
		for (const t of typesNon3D) {
			expect(is3DTransition(t)).toBe(false)
		}
	})
})

describe("isSyncTransition", () => {
	test("returns true for cube and page-turn transitions", () => {
		const syncTypes: SlideTransitionType[] = [
			"cube-left",
			"cube-right",
			"cube-up",
			"cube-down",
			"page-turn",
		]
		for (const t of syncTypes) {
			expect(isSyncTransition(t)).toBe(true)
		}
	})

	test("returns false for non-sync transitions", () => {
		expect(isSyncTransition("fade")).toBe(false)
		expect(isSyncTransition("slide-left")).toBe(false)
		expect(isSyncTransition("zoom")).toBe(false)
	})
})

describe("getCubeTransformOrigin", () => {
	test("returns correct origins for cube-left", () => {
		expect(getCubeTransformOrigin("cube-left", true)).toBe("left center")
		expect(getCubeTransformOrigin("cube-left", false)).toBe("right center")
	})

	test("returns correct origins for cube-right", () => {
		expect(getCubeTransformOrigin("cube-right", true)).toBe("right center")
		expect(getCubeTransformOrigin("cube-right", false)).toBe("left center")
	})

	test("returns correct origins for cube-up", () => {
		expect(getCubeTransformOrigin("cube-up", true)).toBe("center top")
		expect(getCubeTransformOrigin("cube-up", false)).toBe("center bottom")
	})

	test("returns correct origins for cube-down", () => {
		expect(getCubeTransformOrigin("cube-down", true)).toBe("center bottom")
		expect(getCubeTransformOrigin("cube-down", false)).toBe("center top")
	})

	test("returns correct origins for page-turn", () => {
		expect(getCubeTransformOrigin("page-turn", true)).toBe("left center")
		expect(getCubeTransformOrigin("page-turn", false)).toBe("left center")
	})

	test("returns undefined for non-cube transitions", () => {
		expect(getCubeTransformOrigin("fade", true)).toBeUndefined()
		expect(getCubeTransformOrigin("slide-left", false)).toBeUndefined()
	})
})
