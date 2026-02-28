import { describe, expect, test } from "bun:test"
import type { Animation } from "@slidini/core"
import { renderHook } from "@testing-library/react"
import { getMaxStepIndex, useAnimation } from "../hooks/useAnimation"

describe("useAnimation", () => {
	test("returns empty object when no animations", () => {
		const { result } = renderHook(() => useAnimation([], 0))
		expect(Object.keys(result.current)).toHaveLength(0)
	})

	test("returns animation props for fade-in", () => {
		const animations: Animation[] = [
			{
				type: "fade-in",
				duration: 0.5,
				delay: 0,
				easing: "ease-out",
				trigger: "onEnter",
				stepIndex: 0,
			},
		]
		const { result } = renderHook(() => useAnimation(animations, 0))
		expect(result.current).toHaveProperty("initial", "hidden")
		expect(result.current).toHaveProperty("animate", "visible")
		expect(result.current).toHaveProperty("variants")
		expect(result.current).toHaveProperty("transition")
	})

	test("returns hidden state when stepIndex does not match", () => {
		const animations: Animation[] = [
			{
				type: "fade-in",
				duration: 0.5,
				delay: 0,
				easing: "ease-out",
				trigger: "onEnter",
				stepIndex: 2,
			},
		]
		const { result } = renderHook(() => useAnimation(animations, 1))
		expect(result.current).toHaveProperty("animate", "hidden")
	})

	test("returns visible state when currentStep >= stepIndex", () => {
		const animations: Animation[] = [
			{
				type: "slide-in-left",
				duration: 0.5,
				delay: 0,
				easing: "ease-out",
				trigger: "onEnter",
				stepIndex: 1,
			},
		]
		const { result } = renderHook(() => useAnimation(animations, 2))
		expect(result.current).toHaveProperty("animate", "visible")
	})

	test("returns empty object when skipAnimation is true", () => {
		const animations: Animation[] = [
			{
				type: "fade-in",
				duration: 0.5,
				delay: 0,
				easing: "ease-out",
				trigger: "onEnter",
				stepIndex: 0,
			},
		]
		const { result } = renderHook(() => useAnimation(animations, 0, true))
		expect(Object.keys(result.current)).toHaveLength(0)
	})

	test("ignores non-onEnter animations", () => {
		const animations: Animation[] = [
			{
				type: "fade-out",
				duration: 0.5,
				delay: 0,
				easing: "ease-out",
				trigger: "onExit",
				stepIndex: 0,
			},
		]
		const { result } = renderHook(() => useAnimation(animations, 0))
		expect(Object.keys(result.current)).toHaveLength(0)
	})
})

describe("getMaxStepIndex", () => {
	test("returns 0 for empty animations", () => {
		expect(getMaxStepIndex([])).toBe(0)
	})

	test("returns max stepIndex from animations", () => {
		const animations: Animation[] = [
			{
				type: "fade-in",
				duration: 0.5,
				delay: 0,
				easing: "ease-out",
				trigger: "onEnter",
				stepIndex: 1,
			},
			{
				type: "slide-in-left",
				duration: 0.5,
				delay: 0,
				easing: "ease-out",
				trigger: "onEnter",
				stepIndex: 3,
			},
			{
				type: "scale-in",
				duration: 0.5,
				delay: 0,
				easing: "ease-out",
				trigger: "onEnter",
				stepIndex: 2,
			},
		]
		expect(getMaxStepIndex(animations)).toBe(3)
	})
})
