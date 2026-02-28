import { describe, expect, test } from "bun:test"
import {
	createDefaultChartElement,
	createDefaultImageElement,
	createDefaultTextElement,
} from "@slidini/core"
import { render } from "@testing-library/react"
import { SlideElement } from "../components/SlideElement"

describe("SlideElement", () => {
	test("renders TextElement for type=text", () => {
		const el = createDefaultTextElement({ content: "Test text" })
		const { container } = render(
			<SlideElement element={el} currentStep={0} mode="view" scale={1} />,
		)
		expect(container.textContent).toContain("Test text")
	})

	test("renders ImageElement for type=image", () => {
		const el = createDefaultImageElement({ src: "data:image/png;base64,test" })
		const { container } = render(
			<SlideElement element={el} currentStep={0} mode="view" scale={1} />,
		)
		const img = container.querySelector("img")
		expect(img).not.toBeNull()
	})

	test("renders ChartElement for type=chart", () => {
		const el = createDefaultChartElement()
		const { container } = render(
			<SlideElement element={el} currentStep={0} mode="view" scale={1} />,
		)
		// Chart renders via recharts
		expect(container.firstChild).not.toBeNull()
	})

	test("applies position and size styles", () => {
		const el = createDefaultTextElement({
			position: { x: 100, y: 200 },
			size: { width: 500, height: 300 },
		})
		const { container } = render(
			<SlideElement element={el} currentStep={0} mode="view" scale={1} />,
		)
		const wrapper = container.firstChild as HTMLElement
		expect(wrapper.style.left).toBe("100px")
		expect(wrapper.style.top).toBe("200px")
		expect(wrapper.style.width).toBe("500px")
		expect(wrapper.style.height).toBe("300px")
	})

	test("applies rotation transform", () => {
		const el = createDefaultTextElement({ rotation: 45 })
		const { container } = render(
			<SlideElement element={el} currentStep={0} mode="view" scale={1} />,
		)
		const wrapper = container.firstChild as HTMLElement
		expect(wrapper.style.transform).toContain("rotate(45deg)")
	})

	test("shows selection outline in edit mode when selected", () => {
		const el = createDefaultTextElement()
		const { container } = render(
			<SlideElement element={el} currentStep={0} mode="edit" scale={1} isSelected={true} />,
		)
		const wrapper = container.firstChild as HTMLElement
		expect(wrapper.style.outline).toContain("solid")
	})
})
