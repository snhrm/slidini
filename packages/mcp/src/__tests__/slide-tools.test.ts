import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { registerSlideTools } from "../slide-tools"

let client: Client
let tmpDir: string
let originalCwd: string

async function callTool(name: string, args: Record<string, unknown> = {}) {
	const result = await client.callTool({ name, arguments: args })
	return result
}

function parseToolText(result: Awaited<ReturnType<typeof callTool>>): unknown {
	const content = result.content as Array<{ type: string; text: string }>
	return JSON.parse(content[0]?.text ?? "{}")
}

beforeAll(async () => {
	const server = new McpServer({ name: "test", version: "0.0.1" })
	registerSlideTools(server)

	const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
	client = new Client({ name: "test-client", version: "0.0.1" })
	await Promise.all([client.connect(clientTransport), server.connect(serverTransport)])
})

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "slidini-mcp-tools-"))
	originalCwd = process.cwd()
	process.chdir(tmpDir)
	fs.mkdirSync("projects", { recursive: true })
})

afterEach(() => {
	process.chdir(originalCwd)
	fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe("slide_create_presentation", () => {
	test("creates a presentation file", async () => {
		const result = await callTool("slide_create_presentation", { name: "test" })
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as { title: string; slides: number }
		expect(data.title).toBe("無題のプレゼンテーション")
		expect(data.slides).toBe(1)
		expect(fs.existsSync(path.join(tmpDir, "projects/test/test.slide.json"))).toBe(true)
	})

	test("creates with custom title and dimensions", async () => {
		const result = await callTool("slide_create_presentation", {
			name: "custom",
			title: "My Presentation",
			width: 3840,
			height: 2160,
		})
		const data = parseToolText(result) as { title: string; width: number; height: number }
		expect(data.title).toBe("My Presentation")
		expect(data.width).toBe(3840)
		expect(data.height).toBe(2160)
	})
})

describe("slide_read_presentation", () => {
	test("reads existing presentation", async () => {
		await callTool("slide_create_presentation", { name: "read-test" })
		const result = await callTool("slide_read_presentation", {
			file_path: "read-test/read-test.slide.json",
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as { meta: { schemaVersion: number }; slides: unknown[] }
		expect(data.meta.schemaVersion).toBe(1)
		expect(data.slides.length).toBe(1)
	})

	test("returns error for nonexistent file", async () => {
		const result = await callTool("slide_read_presentation", {
			file_path: "nonexistent.slide.json",
		})
		expect(result.isError).toBe(true)
	})
})

describe("slide_list_slides", () => {
	test("lists slides with summaries", async () => {
		await callTool("slide_create_presentation", { name: "list-test" })
		const result = await callTool("slide_list_slides", {
			file_path: "list-test/list-test.slide.json",
		})
		const data = parseToolText(result) as { totalSlides: number; slides: unknown[] }
		expect(data.totalSlides).toBe(1)
		expect(data.slides).toHaveLength(1)
	})
})

describe("slide_add_slide", () => {
	test("adds a slide at the end", async () => {
		await callTool("slide_create_presentation", { name: "add-test" })
		const result = await callTool("slide_add_slide", {
			file_path: "add-test/add-test.slide.json",
		})
		const data = parseToolText(result) as { id: string; index: number }
		expect(data.id).toMatch(/^slide-/)
		expect(data.index).toBe(1)
	})

	test("adds a slide with custom background", async () => {
		await callTool("slide_create_presentation", { name: "bg-test" })
		await callTool("slide_add_slide", {
			file_path: "bg-test/bg-test.slide.json",
			background_color: "#ff0000",
		})
		const result = await callTool("slide_read_presentation", {
			file_path: "bg-test/bg-test.slide.json",
		})
		const data = parseToolText(result) as { slides: Array<{ background: { value: string } }> }
		expect(data.slides[1]?.background.value).toBe("#ff0000")
	})

	test("inserts slide at specific index", async () => {
		await callTool("slide_create_presentation", { name: "insert-test" })
		await callTool("slide_add_slide", { file_path: "insert-test/insert-test.slide.json" })
		const result = await callTool("slide_add_slide", {
			file_path: "insert-test/insert-test.slide.json",
			insert_at: 0,
		})
		const data = parseToolText(result) as { index: number }
		expect(data.index).toBe(0)
	})
})

describe("slide_remove_slide", () => {
	test("removes a slide by id", async () => {
		await callTool("slide_create_presentation", { name: "rm-test" })
		const addResult = await callTool("slide_add_slide", {
			file_path: "rm-test/rm-test.slide.json",
		})
		const addData = parseToolText(addResult) as { id: string }

		const rmResult = await callTool("slide_remove_slide", {
			file_path: "rm-test/rm-test.slide.json",
			slide_id: addData.id,
		})
		const rmData = parseToolText(rmResult) as { removed: string; remainingSlides: number }
		expect(rmData.removed).toBe(addData.id)
		expect(rmData.remainingSlides).toBe(1)
	})

	test("cannot remove last slide", async () => {
		await callTool("slide_create_presentation", { name: "rm-last" })
		const readResult = await callTool("slide_read_presentation", {
			file_path: "rm-last/rm-last.slide.json",
		})
		const pres = parseToolText(readResult) as { slides: Array<{ id: string }> }

		const rmResult = await callTool("slide_remove_slide", {
			file_path: "rm-last/rm-last.slide.json",
			slide_id: pres.slides[0]?.id ?? "",
		})
		expect(rmResult.isError).toBe(true)
	})
})

describe("slide_add_text_element", () => {
	test("adds text element to slide", async () => {
		await callTool("slide_create_presentation", { name: "text-test" })
		const readResult = await callTool("slide_read_presentation", {
			file_path: "text-test/text-test.slide.json",
		})
		const pres = parseToolText(readResult) as { slides: Array<{ id: string }> }

		const result = await callTool("slide_add_text_element", {
			file_path: "text-test/text-test.slide.json",
			slide_id: pres.slides[0]?.id ?? "",
			content: "# Hello World",
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as { id: string }
		expect(data.id).toMatch(/^text-/)
	})

	test("adds text element with custom style", async () => {
		await callTool("slide_create_presentation", { name: "style-test" })
		const readResult = await callTool("slide_read_presentation", {
			file_path: "style-test/style-test.slide.json",
		})
		const pres = parseToolText(readResult) as { slides: Array<{ id: string }> }

		await callTool("slide_add_text_element", {
			file_path: "style-test/style-test.slide.json",
			slide_id: pres.slides[0]?.id ?? "",
			content: "Styled",
			font_size: 64,
			color: "#ff0000",
			text_align: "center",
			font_weight: "bold",
		})

		const updated = await callTool("slide_read_presentation", {
			file_path: "style-test/style-test.slide.json",
		})
		const data = parseToolText(updated) as {
			slides: Array<{
				elements: Array<{ type: string; style: { fontSize: number; color: string } }>
			}>
		}
		const elements = data.slides[0]?.elements ?? []
		const added = elements[elements.length - 1]
		expect(added?.style.fontSize).toBe(64)
		expect(added?.style.color).toBe("#ff0000")
	})
})

describe("slide_add_image_element", () => {
	test("adds image element to slide", async () => {
		await callTool("slide_create_presentation", { name: "img-test" })
		const readResult = await callTool("slide_read_presentation", {
			file_path: "img-test/img-test.slide.json",
		})
		const pres = parseToolText(readResult) as { slides: Array<{ id: string }> }

		const result = await callTool("slide_add_image_element", {
			file_path: "img-test/img-test.slide.json",
			slide_id: pres.slides[0]?.id ?? "",
			src: "data:image/png;base64,test",
		})
		const data = parseToolText(result) as { id: string }
		expect(data.id).toMatch(/^img-/)
	})
})

describe("slide_add_chart_element", () => {
	test("adds chart element to slide", async () => {
		await callTool("slide_create_presentation", { name: "chart-test" })
		const readResult = await callTool("slide_read_presentation", {
			file_path: "chart-test/chart-test.slide.json",
		})
		const pres = parseToolText(readResult) as { slides: Array<{ id: string }> }

		const result = await callTool("slide_add_chart_element", {
			file_path: "chart-test/chart-test.slide.json",
			slide_id: pres.slides[0]?.id ?? "",
			chart_type: "bar",
			categories: ["A", "B", "C"],
			series: JSON.stringify([{ name: "Sales", data: [10, 20, 30], color: "#667eea" }]),
		})
		const data = parseToolText(result) as { id: string }
		expect(data.id).toMatch(/^chart-/)
	})
})

describe("slide_update_element", () => {
	test("updates text element content and style", async () => {
		await callTool("slide_create_presentation", { name: "upd-test" })
		const readResult = await callTool("slide_read_presentation", {
			file_path: "upd-test/upd-test.slide.json",
		})
		const pres = parseToolText(readResult) as {
			slides: Array<{ id: string; elements: Array<{ id: string }> }>
		}
		const slideId = pres.slides[0]?.id ?? ""
		const elementId = pres.slides[0]?.elements[0]?.id ?? ""

		const result = await callTool("slide_update_element", {
			file_path: "upd-test/upd-test.slide.json",
			slide_id: slideId,
			element_id: elementId,
			content: "Updated content",
			x: 100,
			y: 200,
			font_size: 48,
		})
		expect(result.isError).toBeUndefined()

		const updated = await callTool("slide_read_presentation", {
			file_path: "upd-test/upd-test.slide.json",
		})
		const data = parseToolText(updated) as {
			slides: Array<{
				elements: Array<{
					content: string
					position: { x: number; y: number }
					style: { fontSize: number }
				}>
			}>
		}
		const el = data.slides[0]?.elements[0]
		expect(el?.content).toBe("Updated content")
		expect(el?.position.x).toBe(100)
		expect(el?.style.fontSize).toBe(48)
	})

	test("returns error for nonexistent element", async () => {
		await callTool("slide_create_presentation", { name: "upd-err" })
		const readResult = await callTool("slide_read_presentation", {
			file_path: "upd-err/upd-err.slide.json",
		})
		const pres = parseToolText(readResult) as { slides: Array<{ id: string }> }

		const result = await callTool("slide_update_element", {
			file_path: "upd-err/upd-err.slide.json",
			slide_id: pres.slides[0]?.id ?? "",
			element_id: "nonexistent",
			content: "test",
		})
		expect(result.isError).toBe(true)
	})
})

describe("slide_remove_element", () => {
	test("removes element from slide", async () => {
		await callTool("slide_create_presentation", { name: "rm-el" })
		const readResult = await callTool("slide_read_presentation", {
			file_path: "rm-el/rm-el.slide.json",
		})
		const pres = parseToolText(readResult) as {
			slides: Array<{ id: string; elements: Array<{ id: string }> }>
		}
		const slideId = pres.slides[0]?.id ?? ""
		const elementId = pres.slides[0]?.elements[0]?.id ?? ""

		const result = await callTool("slide_remove_element", {
			file_path: "rm-el/rm-el.slide.json",
			slide_id: slideId,
			element_id: elementId,
		})
		const data = parseToolText(result) as { removed: string; remainingElements: number }
		expect(data.removed).toBe(elementId)
		expect(data.remainingElements).toBe(0)
	})

	test("returns error for nonexistent element", async () => {
		await callTool("slide_create_presentation", { name: "rm-el-err" })
		const readResult = await callTool("slide_read_presentation", {
			file_path: "rm-el-err/rm-el-err.slide.json",
		})
		const pres = parseToolText(readResult) as { slides: Array<{ id: string }> }

		const result = await callTool("slide_remove_element", {
			file_path: "rm-el-err/rm-el-err.slide.json",
			slide_id: pres.slides[0]?.id ?? "",
			element_id: "nonexistent",
		})
		expect(result.isError).toBe(true)
	})
})

describe("slide_update_slide_background", () => {
	test("updates to color background", async () => {
		await callTool("slide_create_presentation", { name: "bg-upd" })
		const readResult = await callTool("slide_read_presentation", {
			file_path: "bg-upd/bg-upd.slide.json",
		})
		const pres = parseToolText(readResult) as { slides: Array<{ id: string }> }

		const result = await callTool("slide_update_slide_background", {
			file_path: "bg-upd/bg-upd.slide.json",
			slide_id: pres.slides[0]?.id ?? "",
			background_type: "color",
			value: "#ff0000",
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as { background: { type: string; value: string } }
		expect(data.background.type).toBe("color")
		expect(data.background.value).toBe("#ff0000")
	})

	test("updates to gradient background", async () => {
		await callTool("slide_create_presentation", { name: "bg-grad" })
		const readResult = await callTool("slide_read_presentation", {
			file_path: "bg-grad/bg-grad.slide.json",
		})
		const pres = parseToolText(readResult) as { slides: Array<{ id: string }> }

		const result = await callTool("slide_update_slide_background", {
			file_path: "bg-grad/bg-grad.slide.json",
			slide_id: pres.slides[0]?.id ?? "",
			background_type: "gradient",
			gradient_kind: "linear",
			gradient_angle: 90,
			gradient_stops: JSON.stringify([
				{ color: "#000", position: 0 },
				{ color: "#fff", position: 100 },
			]),
		})
		expect(result.isError).toBeUndefined()
	})

	test("returns error for image without src", async () => {
		await callTool("slide_create_presentation", { name: "bg-img-err" })
		const readResult = await callTool("slide_read_presentation", {
			file_path: "bg-img-err/bg-img-err.slide.json",
		})
		const pres = parseToolText(readResult) as { slides: Array<{ id: string }> }

		const result = await callTool("slide_update_slide_background", {
			file_path: "bg-img-err/bg-img-err.slide.json",
			slide_id: pres.slides[0]?.id ?? "",
			background_type: "image",
		})
		expect(result.isError).toBe(true)
	})
})

describe("slide_update_slide_transition", () => {
	test("updates transition type", async () => {
		await callTool("slide_create_presentation", { name: "tr-test" })
		const readResult = await callTool("slide_read_presentation", {
			file_path: "tr-test/tr-test.slide.json",
		})
		const pres = parseToolText(readResult) as { slides: Array<{ id: string }> }

		const result = await callTool("slide_update_slide_transition", {
			file_path: "tr-test/tr-test.slide.json",
			slide_id: pres.slides[0]?.id ?? "",
			type: "slide-left",
			duration: 1.0,
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as {
			transition: { type: string; duration: number }
		}
		expect(data.transition.type).toBe("slide-left")
		expect(data.transition.duration).toBe(1.0)
	})
})

describe("slide_update_meta", () => {
	test("updates presentation metadata", async () => {
		await callTool("slide_create_presentation", { name: "meta-test" })
		const result = await callTool("slide_update_meta", {
			file_path: "meta-test/meta-test.slide.json",
			title: "New Title",
			width: 3840,
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as { meta: { title: string; width: number } }
		expect(data.meta.title).toBe("New Title")
		expect(data.meta.width).toBe(3840)
	})
})

describe("slide_reorder_slides", () => {
	test("moves slide from one position to another", async () => {
		await callTool("slide_create_presentation", { name: "reorder" })
		await callTool("slide_add_slide", { file_path: "reorder/reorder.slide.json" })
		await callTool("slide_add_slide", { file_path: "reorder/reorder.slide.json" })

		const result = await callTool("slide_reorder_slides", {
			file_path: "reorder/reorder.slide.json",
			from_index: 2,
			to_index: 0,
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as { from: number; to: number; order: string[] }
		expect(data.from).toBe(2)
		expect(data.to).toBe(0)
		expect(data.order).toHaveLength(3)
	})
})

describe("slide_add_element_animation", () => {
	test("adds animation to element", async () => {
		await callTool("slide_create_presentation", { name: "anim-test" })
		const readResult = await callTool("slide_read_presentation", {
			file_path: "anim-test/anim-test.slide.json",
		})
		const pres = parseToolText(readResult) as {
			slides: Array<{ id: string; elements: Array<{ id: string }> }>
		}

		const result = await callTool("slide_add_element_animation", {
			file_path: "anim-test/anim-test.slide.json",
			slide_id: pres.slides[0]?.id ?? "",
			element_id: pres.slides[0]?.elements[0]?.id ?? "",
			animation_type: "fade-in",
			duration: 1.0,
			step_index: 1,
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as {
			animation: { type: string; duration: number; stepIndex: number }
		}
		expect(data.animation.type).toBe("fade-in")
		expect(data.animation.duration).toBe(1.0)
		expect(data.animation.stepIndex).toBe(1)
	})
})

describe("slide_list_templates", () => {
	test("returns all templates", async () => {
		const result = await callTool("slide_list_templates")
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as {
			templates: Array<{ id: string; name: string }>
		}
		expect(data.templates.length).toBe(15)
	})
})

describe("slide_add_slide_from_template", () => {
	test("adds slide from template", async () => {
		await callTool("slide_create_presentation", { name: "tpl-test" })
		const result = await callTool("slide_add_slide_from_template", {
			file_path: "tpl-test/tpl-test.slide.json",
			template_id: "title",
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as { id: string; template: string }
		expect(data.template).toBe("title")
	})

	test("returns error for invalid template id", async () => {
		await callTool("slide_create_presentation", { name: "tpl-err" })
		const result = await callTool("slide_add_slide_from_template", {
			file_path: "tpl-err/tpl-err.slide.json",
			template_id: "nonexistent",
		})
		expect(result.isError).toBe(true)
	})
})

describe("slide_list_color_sets", () => {
	test("returns all color sets", async () => {
		const result = await callTool("slide_list_color_sets")
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as {
			colorSets: Array<{ id: string; name: string }>
		}
		expect(data.colorSets.length).toBe(10)
	})
})

describe("slide_apply_color_set", () => {
	test("applies color set to entire presentation", async () => {
		await callTool("slide_create_presentation", { name: "cs-test" })
		const result = await callTool("slide_apply_color_set", {
			file_path: "cs-test/cs-test.slide.json",
			color_set_id: "sakura",
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as { colorSetId: string; slidesUpdated: number }
		expect(data.colorSetId).toBe("sakura")
		expect(data.slidesUpdated).toBe(1)
	})

	test("returns error for invalid color set id", async () => {
		await callTool("slide_create_presentation", { name: "cs-err" })
		const result = await callTool("slide_apply_color_set", {
			file_path: "cs-err/cs-err.slide.json",
			color_set_id: "nonexistent",
		})
		expect(result.isError).toBe(true)
	})
})

describe("slide_apply_slide_color_set", () => {
	test("applies color set to single slide", async () => {
		await callTool("slide_create_presentation", { name: "scs-test" })
		const readResult = await callTool("slide_read_presentation", {
			file_path: "scs-test/scs-test.slide.json",
		})
		const pres = parseToolText(readResult) as { slides: Array<{ id: string }> }

		const result = await callTool("slide_apply_slide_color_set", {
			file_path: "scs-test/scs-test.slide.json",
			slide_id: pres.slides[0]?.id ?? "",
			color_set_id: "ocean-breeze",
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as { colorSetId: string }
		expect(data.colorSetId).toBe("ocean-breeze")
	})
})

describe("slide_add_overlay_element", () => {
	test("adds text overlay element", async () => {
		await callTool("slide_create_presentation", { name: "overlay-test" })
		const result = await callTool("slide_add_overlay_element", {
			file_path: "overlay-test/overlay-test.slide.json",
			layer: "foreground",
			element_type: "text",
			content: "Watermark",
			opacity: 0.3,
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as { id: string; layer: string }
		expect(data.layer).toBe("foreground")
		expect(data.id).toMatch(/^text-/)
	})

	test("adds image overlay element", async () => {
		await callTool("slide_create_presentation", { name: "overlay-img" })
		const result = await callTool("slide_add_overlay_element", {
			file_path: "overlay-img/overlay-img.slide.json",
			layer: "background",
			element_type: "image",
			src: "data:image/png;base64,test",
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as { layer: string }
		expect(data.layer).toBe("background")
	})
})

describe("slide_remove_overlay_element", () => {
	test("removes overlay element", async () => {
		await callTool("slide_create_presentation", { name: "rm-overlay" })
		const addResult = await callTool("slide_add_overlay_element", {
			file_path: "rm-overlay/rm-overlay.slide.json",
			layer: "foreground",
			element_type: "text",
			content: "Remove me",
		})
		const addData = parseToolText(addResult) as { id: string }

		const result = await callTool("slide_remove_overlay_element", {
			file_path: "rm-overlay/rm-overlay.slide.json",
			layer: "foreground",
			element_id: addData.id,
		})
		expect(result.isError).toBeUndefined()
		const data = parseToolText(result) as { removed: string }
		expect(data.removed).toBe(addData.id)
	})
})

describe("slide_update_overlay_element", () => {
	test("updates overlay element properties", async () => {
		await callTool("slide_create_presentation", { name: "upd-overlay" })
		const addResult = await callTool("slide_add_overlay_element", {
			file_path: "upd-overlay/upd-overlay.slide.json",
			layer: "foreground",
			element_type: "text",
			content: "Original",
		})
		const addData = parseToolText(addResult) as { id: string }

		const result = await callTool("slide_update_overlay_element", {
			file_path: "upd-overlay/upd-overlay.slide.json",
			layer: "foreground",
			element_id: addData.id,
			content: "Updated",
			opacity: 0.5,
			x: 50,
			y: 50,
		})
		expect(result.isError).toBeUndefined()

		const readResult = await callTool("slide_read_presentation", {
			file_path: "upd-overlay/upd-overlay.slide.json",
		})
		const pres = parseToolText(readResult) as {
			overlayForegroundElements: Array<{
				content: string
				opacity: number
				position: { x: number }
			}>
		}
		const el = pres.overlayForegroundElements?.[0]
		expect(el?.content).toBe("Updated")
		expect(el?.opacity).toBe(0.5)
		expect(el?.position.x).toBe(50)
	})
})
