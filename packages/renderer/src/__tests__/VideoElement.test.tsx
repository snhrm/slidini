import { describe, expect, test } from "bun:test"
import { createDefaultVideoElement } from "@slidini/core"
import { render } from "@testing-library/react"
import { VideoElement } from "../components/VideoElement"

describe("VideoElement", () => {
	test("renders video tag when src is set", () => {
		const el = createDefaultVideoElement({ src: "data:video/mp4;base64,test" })
		const { container } = render(<VideoElement element={el} currentStep={0} />)
		const video = container.querySelector("video")
		expect(video).not.toBeNull()
		expect(video?.getAttribute("src")).toBe("data:video/mp4;base64,test")
	})

	test("applies autoplay, loop, muted attributes", () => {
		const el = createDefaultVideoElement({
			src: "test.mp4",
			autoplay: true,
			loop: true,
			muted: false,
		})
		const { container } = render(<VideoElement element={el} currentStep={0} />)
		const video = container.querySelector("video")
		expect(video).not.toBeNull()
		expect(video?.loop).toBe(true)
	})

	test("renders placeholder when src is empty", () => {
		const el = createDefaultVideoElement({ src: "" })
		const { container } = render(<VideoElement element={el} currentStep={0} />)
		expect(container.querySelector("video")).toBeNull()
		expect(container.textContent).toContain("動画未設定")
	})
})
