import { describe, expect, test } from "bun:test"
import type { TextElement as TextElementType } from "@slidini/core"
import { createDefaultTextElement, createDefaultTextStyle } from "@slidini/core"
import { render } from "@testing-library/react"
import { TextElement } from "../components/TextElement"

function createTextElement(overrides?: Partial<TextElementType>): TextElementType {
	return createDefaultTextElement(overrides)
}

describe("TextElement", () => {
	test("renders heading content", () => {
		const el = createTextElement({ content: "# Heading 1" })
		const { container } = render(<TextElement element={el} currentStep={0} />)
		const h1 = container.querySelector("h1")
		expect(h1).not.toBeNull()
		expect(h1?.textContent).toBe("Heading 1")
	})

	test("renders h2 heading", () => {
		const el = createTextElement({ content: "## Heading 2" })
		const { container } = render(<TextElement element={el} currentStep={0} />)
		expect(container.querySelector("h2")).not.toBeNull()
	})

	test("renders h3 heading", () => {
		const el = createTextElement({ content: "### Heading 3" })
		const { container } = render(<TextElement element={el} currentStep={0} />)
		expect(container.querySelector("h3")).not.toBeNull()
	})

	test("renders h4 heading", () => {
		const el = createTextElement({ content: "#### Heading 4" })
		const { container } = render(<TextElement element={el} currentStep={0} />)
		expect(container.querySelector("h4")).not.toBeNull()
	})

	test("renders paragraph", () => {
		const el = createTextElement({ content: "Hello world" })
		const { container } = render(<TextElement element={el} currentStep={0} />)
		const p = container.querySelector("p")
		expect(p).not.toBeNull()
		expect(p?.textContent).toBe("Hello world")
	})

	test("renders unordered list", () => {
		const el = createTextElement({ content: "- Item 1\n- Item 2" })
		const { container } = render(<TextElement element={el} currentStep={0} />)
		const ul = container.querySelector("ul")
		expect(ul).not.toBeNull()
		const items = container.querySelectorAll("li")
		expect(items).toHaveLength(2)
	})

	test("renders ordered list", () => {
		const el = createTextElement({ content: "1. First\n2. Second" })
		const { container } = render(<TextElement element={el} currentStep={0} />)
		expect(container.querySelector("ol")).not.toBeNull()
	})

	test("renders inline code element", () => {
		const el = createTextElement({ content: "Use `console.log`" })
		const { container } = render(<TextElement element={el} currentStep={0} />)
		const code = container.querySelector("code")
		expect(code).not.toBeNull()
		expect(code?.textContent).toBe("console.log")
	})

	test("renders blockquote", () => {
		const el = createTextElement({ content: "> Quote text" })
		const { container } = render(<TextElement element={el} currentStep={0} />)
		expect(container.querySelector("blockquote")).not.toBeNull()
	})

	test("renders table", () => {
		const el = createTextElement({
			content: "| A | B |\n| --- | --- |\n| 1 | 2 |",
		})
		const { container } = render(<TextElement element={el} currentStep={0} />)
		expect(container.querySelector("table")).not.toBeNull()
		expect(container.querySelector("th")).not.toBeNull()
		expect(container.querySelector("td")).not.toBeNull()
	})

	test("applies fontSize inherit to headings", () => {
		const el = createTextElement({ content: "# Big Title" })
		const { container } = render(<TextElement element={el} currentStep={0} />)
		const h1 = container.querySelector("h1")
		expect(h1?.style.fontSize).toBe("inherit")
	})
})
