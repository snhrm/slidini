import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import {
	type Background,
	type Presentation,
	createDefaultChartElement,
	createDefaultChartStyle,
	createDefaultImageElement,
	createDefaultPresentation,
	createDefaultSlide,
	createDefaultTextElement,
	createDefaultTextStyle,
} from "@slidini/core"
import {
	COLOR_SETS,
	SLIDE_TEMPLATES,
	applyColorSetToSlide,
	createSlideFromTemplate,
	getColorSetColors,
	getSlideTemplate,
	resolveOldColors,
} from "@slidini/templates"
import { z } from "zod"
import {
	err,
	findSlide,
	findSlideByIndex,
	ok,
	readPresentation,
	resolveSlideFile,
	writePresentation,
} from "./index"

export function registerSlideTools(server: McpServer): void {
	// ----- slide_create_presentation -----

	server.registerTool(
		"slide_create_presentation",
		{
			title: "Create Presentation",
			description: `Create a new .slide.json presentation file with default content.

Args:
  - file_path (string): Path to the .slide.json file to create
  - title (string, optional): Presentation title (default: "無題のプレゼンテーション")
  - width (number, optional): Slide width in px (default: 1920)
  - height (number, optional): Slide height in px (default: 1080)

Returns: JSON summary of the created presentation.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file to create"),
				title: z.string().optional().describe("Presentation title"),
				width: z.number().int().min(1).optional().describe("Slide width in px"),
				height: z.number().int().min(1).optional().describe("Slide height in px"),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false,
			},
		},
		async ({ file_path, title, width, height }) => {
			try {
				const presentation = createDefaultPresentation()
				if (title !== undefined) presentation.meta.title = title
				if (width !== undefined) presentation.meta.width = width
				if (height !== undefined) presentation.meta.height = height
				writePresentation(file_path, presentation)
				return ok(
					JSON.stringify(
						{
							file: resolveSlideFile(file_path),
							title: presentation.meta.title,
							width: presentation.meta.width,
							height: presentation.meta.height,
							slides: presentation.slides.length,
						},
						null,
						2,
					),
				)
			} catch (e) {
				return err(`Error creating presentation: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_read_presentation -----

	server.registerTool(
		"slide_read_presentation",
		{
			title: "Read Presentation",
			description: `Read a .slide.json file and return its full content.

Args:
  - file_path (string): Path to the .slide.json file

Returns: Full presentation JSON with meta, slides, and all elements.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file"),
			},
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async ({ file_path }) => {
			try {
				const presentation = readPresentation(file_path)
				return ok(JSON.stringify(presentation, null, 2))
			} catch (e) {
				return err(`Error reading presentation: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_list_slides -----

	server.registerTool(
		"slide_list_slides",
		{
			title: "List Slides",
			description: `List all slides in a presentation with their IDs, element counts, and background info.

Args:
  - file_path (string): Path to the .slide.json file

Returns: Array of slide summaries with id, index, elementCount, and background type.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file"),
			},
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async ({ file_path }) => {
			try {
				const presentation = readPresentation(file_path)
				const slides = presentation.slides.map((s, i) => ({
					index: i,
					id: s.id,
					elementCount: s.elements.length,
					elements: s.elements.map((el) => ({
						id: el.id,
						type: el.type,
						...(el.type === "text" ? { content: el.content.slice(0, 80) } : {}),
					})),
					backgroundType: s.background.type,
					transitionType: s.transition.type,
				}))
				return ok(
					JSON.stringify(
						{ title: presentation.meta.title, totalSlides: slides.length, slides },
						null,
						2,
					),
				)
			} catch (e) {
				return err(`Error listing slides: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_add_slide -----

	server.registerTool(
		"slide_add_slide",
		{
			title: "Add Slide",
			description: `Add a new empty slide to the presentation. By default inserts at the end.

Args:
  - file_path (string): Path to the .slide.json file
  - insert_at (number, optional): Index to insert at (0-based). Defaults to end.
  - background_color (string, optional): Background color (default: "#1e293b")

Returns: The new slide's id and its index.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file"),
				insert_at: z
					.number()
					.int()
					.min(0)
					.optional()
					.describe("Index to insert the slide at (0-based)"),
				background_color: z.string().optional().describe("Background color hex (default: #1e293b)"),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false,
			},
		},
		async ({ file_path, insert_at, background_color }) => {
			try {
				const presentation = readPresentation(file_path)
				const newSlide = createDefaultSlide()
				if (background_color) {
					newSlide.background = { type: "color", value: background_color }
				}
				const idx = insert_at ?? presentation.slides.length
				presentation.slides.splice(idx, 0, newSlide)
				writePresentation(file_path, presentation)
				return ok(JSON.stringify({ id: newSlide.id, index: idx }, null, 2))
			} catch (e) {
				return err(`Error adding slide: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_remove_slide -----

	server.registerTool(
		"slide_remove_slide",
		{
			title: "Remove Slide",
			description: `Remove a slide from the presentation by its ID. Cannot remove the last remaining slide.

Args:
  - file_path (string): Path to the .slide.json file
  - slide_id (string): ID of the slide to remove

Returns: Confirmation with remaining slide count.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file"),
				slide_id: z.string().describe("ID of the slide to remove"),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: true,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async ({ file_path, slide_id }) => {
			try {
				const presentation = readPresentation(file_path)
				if (presentation.slides.length <= 1) {
					return err("Cannot remove the last slide. A presentation must have at least one slide.")
				}
				const before = presentation.slides.length
				presentation.slides = presentation.slides.filter((s) => s.id !== slide_id)
				if (presentation.slides.length === before) {
					return err(`Slide not found: ${slide_id}`)
				}
				writePresentation(file_path, presentation)
				return ok(
					JSON.stringify(
						{ removed: slide_id, remainingSlides: presentation.slides.length },
						null,
						2,
					),
				)
			} catch (e) {
				return err(`Error removing slide: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_add_text_element -----

	server.registerTool(
		"slide_add_text_element",
		{
			title: "Add Text Element",
			description: `Add a text element to a slide. The content supports Markdown syntax.

Args:
  - file_path (string): Path to the .slide.json file
  - slide_id (string): ID of the target slide
  - content (string): Text content (Markdown supported)
  - x (number, optional): X position in px (default: 160)
  - y (number, optional): Y position in px (default: 340)
  - width (number, optional): Width in px (default: 1600)
  - height (number, optional): Height in px (default: 400)
  - font_size (number, optional): Font size in px (default: 32)
  - color (string, optional): Text color hex (default: "#ffffff")
  - text_align (string, optional): "left" | "center" | "right" (default: "left")
  - font_weight (string, optional): "normal" | "bold" (default: "normal")
  - font_family (string, optional): Font family name (default: "Noto Sans JP"). Available: "Noto Sans JP", "Zen Kaku Gothic New", "M PLUS 1p", "M PLUS Rounded 1c", "BIZ UDPGothic", "Noto Serif JP", "Shippori Mincho", "Zen Antique", "Dela Gothic One", "Reggae One", "Rampart One", "Kiwi Maru"

Returns: The new element's id.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file"),
				slide_id: z.string().describe("ID of the target slide"),
				content: z.string().describe("Text content (Markdown supported)"),
				x: z.number().optional().describe("X position in px"),
				y: z.number().optional().describe("Y position in px"),
				width: z.number().min(1).optional().describe("Width in px"),
				height: z.number().min(1).optional().describe("Height in px"),
				font_size: z.number().min(1).optional().describe("Font size in px"),
				color: z.string().optional().describe("Text color hex"),
				text_align: z.enum(["left", "center", "right"]).optional().describe("Text alignment"),
				font_weight: z.enum(["normal", "bold"]).optional().describe("Font weight"),
				font_family: z.string().optional().describe("Font family name"),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false,
			},
		},
		async ({
			file_path,
			slide_id,
			content,
			x,
			y,
			width,
			height,
			font_size,
			color,
			text_align,
			font_weight,
			font_family,
		}) => {
			try {
				const presentation = readPresentation(file_path)
				const slide = findSlide(presentation, slide_id)
				const element = createDefaultTextElement({
					content,
					...(x !== undefined || y !== undefined ? { position: { x: x ?? 160, y: y ?? 340 } } : {}),
					...(width !== undefined || height !== undefined
						? { size: { width: width ?? 1600, height: height ?? 400 } }
						: {}),
					style: createDefaultTextStyle({
						...(font_size !== undefined ? { fontSize: font_size } : {}),
						...(color !== undefined ? { color } : {}),
						...(text_align !== undefined ? { textAlign: text_align } : {}),
						...(font_weight !== undefined ? { fontWeight: font_weight } : {}),
						...(font_family !== undefined ? { fontFamily: font_family } : {}),
					}),
				})
				slide.elements.push(element)
				writePresentation(file_path, presentation)
				return ok(JSON.stringify({ id: element.id, slideId: slide_id }, null, 2))
			} catch (e) {
				return err(`Error adding text element: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_add_image_element -----

	server.registerTool(
		"slide_add_image_element",
		{
			title: "Add Image Element",
			description: `Add an image element to a slide. Accepts URL or Base64 data URI.

Args:
  - file_path (string): Path to the .slide.json file
  - slide_id (string): ID of the target slide
  - src (string): Image URL or Base64 data URI
  - x (number, optional): X position in px (default: 460)
  - y (number, optional): Y position in px (default: 190)
  - width (number, optional): Width in px (default: 1000)
  - height (number, optional): Height in px (default: 700)
  - fit (string, optional): "cover" | "contain" | "fill" (default: "contain")

Returns: The new element's id.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file"),
				slide_id: z.string().describe("ID of the target slide"),
				src: z.string().describe("Image URL or Base64 data URI"),
				x: z.number().optional().describe("X position in px"),
				y: z.number().optional().describe("Y position in px"),
				width: z.number().min(1).optional().describe("Width in px"),
				height: z.number().min(1).optional().describe("Height in px"),
				fit: z.enum(["cover", "contain", "fill"]).optional().describe("Image fit mode"),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false,
			},
		},
		async ({ file_path, slide_id, src, x, y, width, height, fit }) => {
			try {
				const presentation = readPresentation(file_path)
				const slide = findSlide(presentation, slide_id)
				const element = createDefaultImageElement({
					src,
					...(x !== undefined || y !== undefined ? { position: { x: x ?? 460, y: y ?? 190 } } : {}),
					...(width !== undefined || height !== undefined
						? { size: { width: width ?? 1000, height: height ?? 700 } }
						: {}),
					...(fit !== undefined ? { fit } : {}),
				})
				slide.elements.push(element)
				writePresentation(file_path, presentation)
				return ok(JSON.stringify({ id: element.id, slideId: slide_id }, null, 2))
			} catch (e) {
				return err(`Error adding image element: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_add_chart_element -----

	server.registerTool(
		"slide_add_chart_element",
		{
			title: "Add Chart Element",
			description: `Add a chart element to a slide.

Args:
  - file_path (string): Path to the .slide.json file
  - slide_id (string): ID of the target slide
  - chart_type (string): "bar" | "line" | "pie" | "donut" | "area" | "radar"
  - categories (string[]): Category labels
  - series (string): JSON array of {name, data, color} objects
  - x, y, width, height (number, optional): Position and size
  - show_legend (boolean, optional): Show legend (default: true)
  - stacked (boolean, optional): Stack bars/areas (default: false)
  - inner_radius (number, optional): Inner radius % for donut (default: 0)

Returns: The new element's id and slideId.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file"),
				slide_id: z.string().describe("ID of the target slide"),
				chart_type: z.enum(["bar", "line", "pie", "donut", "area", "radar"]).describe("Chart type"),
				categories: z.array(z.string()).describe("Category labels"),
				series: z.string().describe('JSON: [{"name":"Sales","data":[10,20],"color":"#667eea"}]'),
				x: z.number().optional().describe("X position"),
				y: z.number().optional().describe("Y position"),
				width: z.number().min(1).optional().describe("Width"),
				height: z.number().min(1).optional().describe("Height"),
				show_legend: z.boolean().optional().describe("Show legend"),
				stacked: z.boolean().optional().describe("Stack bars/areas"),
				inner_radius: z.number().min(0).max(100).optional().describe("Donut inner radius %"),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false,
			},
		},
		async ({ file_path, slide_id, chart_type, categories, series, ...opts }) => {
			try {
				const presentation = readPresentation(file_path)
				const slide = findSlide(presentation, slide_id)
				const parsedSeries = JSON.parse(series) as {
					name: string
					data: number[]
					color: string
				}[]
				const element = createDefaultChartElement({
					chartType: chart_type,
					categories,
					series: parsedSeries,
					...(opts.x != null || opts.y != null
						? { position: { x: opts.x ?? 260, y: opts.y ?? 140 } }
						: {}),
					...(opts.width != null || opts.height != null
						? { size: { width: opts.width ?? 1400, height: opts.height ?? 800 } }
						: {}),
					style: createDefaultChartStyle({
						showLegend: opts.show_legend ?? true,
						stacked: opts.stacked ?? false,
						innerRadius: opts.inner_radius ?? 0,
					}),
				})
				slide.elements.push(element)
				writePresentation(file_path, presentation)
				return ok(JSON.stringify({ id: element.id, slideId: slide_id }, null, 2))
			} catch (e) {
				return err(`Error adding chart element: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_update_element -----

	server.registerTool(
		"slide_update_element",
		{
			title: "Update Element",
			description: `Update properties of an existing element. Only provided fields are updated.

Args:
  - file_path (string): Path to the .slide.json file
  - slide_id (string): ID of the slide containing the element
  - element_id (string): ID of the element to update
  - content (string, optional): New text content (text elements only)
  - x (number, optional): New X position
  - y (number, optional): New Y position
  - width (number, optional): New width
  - height (number, optional): New height
  - rotation (number, optional): Rotation in degrees
  - opacity (number, optional): Opacity 0-1
  - z_index (number, optional): Z-index for stacking order
  - font_size (number, optional): Font size (text only)
  - color (string, optional): Text color (text only)
  - text_align (string, optional): Text alignment (text only)
  - font_weight (string, optional): Font weight (text only)
  - font_family (string, optional): Font family name (text only)
  - src (string, optional): Image/video source URL or data URI

Returns: Confirmation of the update.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file"),
				slide_id: z.string().describe("ID of the slide containing the element"),
				element_id: z.string().describe("ID of the element to update"),
				content: z.string().optional().describe("New text content (text elements only)"),
				x: z.number().optional().describe("New X position in px"),
				y: z.number().optional().describe("New Y position in px"),
				width: z.number().min(1).optional().describe("New width in px"),
				height: z.number().min(1).optional().describe("New height in px"),
				rotation: z.number().optional().describe("Rotation in degrees"),
				opacity: z.number().min(0).max(1).optional().describe("Opacity (0-1)"),
				z_index: z.number().int().optional().describe("Z-index for stacking order"),
				font_size: z.number().min(1).optional().describe("Font size in px (text only)"),
				color: z.string().optional().describe("Text color hex (text only)"),
				text_align: z
					.enum(["left", "center", "right"])
					.optional()
					.describe("Text alignment (text only)"),
				font_weight: z.enum(["normal", "bold"]).optional().describe("Font weight (text only)"),
				font_family: z.string().optional().describe("Font family name (text only)"),
				src: z.string().optional().describe("Image/video source URL or data URI"),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async (params) => {
			try {
				const presentation = readPresentation(params.file_path)
				const slide = findSlide(presentation, params.slide_id)
				const element = slide.elements.find((el) => el.id === params.element_id)
				if (!element) {
					return err(
						`Element not found: ${params.element_id}. Available: ${slide.elements.map((el) => el.id).join(", ")}`,
					)
				}

				// Position
				if (params.x !== undefined || params.y !== undefined) {
					element.position = {
						x: params.x ?? element.position.x,
						y: params.y ?? element.position.y,
					}
				}
				// Size
				if (params.width !== undefined || params.height !== undefined) {
					element.size = {
						width: params.width ?? element.size.width,
						height: params.height ?? element.size.height,
					}
				}
				if (params.rotation !== undefined) element.rotation = params.rotation
				if (params.opacity !== undefined) element.opacity = params.opacity
				if (params.z_index !== undefined) element.zIndex = params.z_index

				// Text-specific
				if (element.type === "text") {
					if (params.content !== undefined) element.content = params.content
					if (params.font_size !== undefined) element.style.fontSize = params.font_size
					if (params.color !== undefined) element.style.color = params.color
					if (params.text_align !== undefined) element.style.textAlign = params.text_align
					if (params.font_weight !== undefined) element.style.fontWeight = params.font_weight
					if (params.font_family !== undefined) element.style.fontFamily = params.font_family
				}

				// Image/Video source
				if ((element.type === "image" || element.type === "video") && params.src !== undefined) {
					element.src = params.src
				}

				writePresentation(params.file_path, presentation)
				return ok(JSON.stringify({ updated: params.element_id, slideId: params.slide_id }, null, 2))
			} catch (e) {
				return err(`Error updating element: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_remove_element -----

	server.registerTool(
		"slide_remove_element",
		{
			title: "Remove Element",
			description: `Remove an element from a slide.

Args:
  - file_path (string): Path to the .slide.json file
  - slide_id (string): ID of the slide containing the element
  - element_id (string): ID of the element to remove

Returns: Confirmation of removal.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file"),
				slide_id: z.string().describe("ID of the slide containing the element"),
				element_id: z.string().describe("ID of the element to remove"),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: true,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async ({ file_path, slide_id, element_id }) => {
			try {
				const presentation = readPresentation(file_path)
				const slide = findSlide(presentation, slide_id)
				const before = slide.elements.length
				slide.elements = slide.elements.filter((el) => el.id !== element_id)
				if (slide.elements.length === before) {
					return err(`Element not found: ${element_id}`)
				}
				writePresentation(file_path, presentation)
				return ok(
					JSON.stringify(
						{
							removed: element_id,
							slideId: slide_id,
							remainingElements: slide.elements.length,
						},
						null,
						2,
					),
				)
			} catch (e) {
				return err(`Error removing element: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_update_slide_background -----

	server.registerTool(
		"slide_update_slide_background",
		{
			title: "Update Slide Background",
			description: `Update the background of a slide. Supports solid color, image, or gradient.

Args:
  - file_path (string): Path to the .slide.json file
  - slide_id (string): ID of the slide
  - background_type (string): "color" | "image" | "gradient"
  - value (string, optional): Color hex for "color" type
  - src (string, optional): Image URL/data URI for "image" type
  - fit (string, optional): "cover" | "contain" | "fill" for "image" type
  - gradient_kind (string, optional): "linear" | "radial" for "gradient" type
  - gradient_angle (number, optional): Angle in degrees for linear gradient
  - gradient_stops (string, optional): JSON array of {color, position} stops

Returns: Confirmation of the update.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file"),
				slide_id: z.string().describe("ID of the slide"),
				background_type: z.enum(["color", "image", "gradient"]).describe("Background type"),
				value: z.string().optional().describe("Color hex for color type"),
				src: z.string().optional().describe("Image URL or data URI for image type"),
				fit: z.enum(["cover", "contain", "fill"]).optional().describe("Image fit mode"),
				gradient_kind: z.enum(["linear", "radial"]).optional().describe("Gradient kind"),
				gradient_angle: z.number().optional().describe("Gradient angle in degrees"),
				gradient_stops: z
					.string()
					.optional()
					.describe(
						'JSON array of {color, position} stops, e.g. [{"color":"#000","position":0},{"color":"#fff","position":100}]',
					),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async ({
			file_path,
			slide_id,
			background_type,
			value,
			src,
			fit,
			gradient_kind,
			gradient_angle,
			gradient_stops,
		}) => {
			try {
				const presentation = readPresentation(file_path)
				const slide = findSlide(presentation, slide_id)

				let background: Background
				switch (background_type) {
					case "color":
						background = { type: "color", value: value ?? "#1e293b" }
						break
					case "image":
						if (!src) return err("'src' is required for image background")
						background = { type: "image", src, fit: fit ?? "cover" }
						break
					case "gradient": {
						const rawStops = gradient_stops
							? JSON.parse(gradient_stops)
							: [
									{ color: "#000000", position: 0 },
									{ color: "#ffffff", position: 100 },
								]
						if (
							!Array.isArray(rawStops) ||
							rawStops.length < 2 ||
							!rawStops.every(
								(s: unknown) =>
									typeof s === "object" &&
									s !== null &&
									"color" in s &&
									typeof (s as Record<string, unknown>).color === "string" &&
									"position" in s &&
									typeof (s as Record<string, unknown>).position === "number",
							)
						) {
							return err(
								"Invalid gradient_stops: must be a JSON array of at least 2 objects with {color: string, position: number}",
							)
						}
						const stops = rawStops as { color: string; position: number }[]
						background = {
							type: "gradient",
							gradient: {
								kind: gradient_kind ?? "linear",
								angle: gradient_angle ?? 180,
								stops,
							},
						}
						break
					}
				}

				slide.background = background
				writePresentation(file_path, presentation)
				return ok(JSON.stringify({ slideId: slide_id, background: slide.background }, null, 2))
			} catch (e) {
				return err(`Error updating background: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_update_slide_transition -----

	server.registerTool(
		"slide_update_slide_transition",
		{
			title: "Update Slide Transition",
			description: `Update the transition effect of a slide.

Args:
  - file_path (string): Path to the .slide.json file
  - slide_id (string): ID of the slide
  - type (string): Transition type: "none" | "fade" | "slide-left" | "slide-right" | "slide-up" | "slide-down" | "zoom" | "flip-x" | "flip-y" | "rotate" | "scale-fade" | "wipe-left" | "wipe-right" | "wipe-up" | "wipe-down"
  - duration (number, optional): Duration in seconds (default: 0.5)
  - easing (string, optional): CSS easing function (default: "ease-out")

Returns: Confirmation with the new transition settings.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file"),
				slide_id: z.string().describe("ID of the slide"),
				type: z
					.enum([
						"none",
						"fade",
						"slide-left",
						"slide-right",
						"slide-up",
						"slide-down",
						"zoom",
						"flip-x",
						"flip-y",
						"rotate",
						"scale-fade",
						"wipe-left",
						"wipe-right",
						"wipe-up",
						"wipe-down",
					])
					.describe("Transition type"),
				duration: z.number().min(0).optional().describe("Duration in seconds"),
				easing: z.string().optional().describe("CSS easing function"),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async ({ file_path, slide_id, type, duration, easing }) => {
			try {
				const presentation = readPresentation(file_path)
				const slide = findSlide(presentation, slide_id)
				slide.transition = {
					type,
					duration: duration ?? slide.transition.duration,
					easing: easing ?? slide.transition.easing,
				}
				writePresentation(file_path, presentation)
				return ok(JSON.stringify({ slideId: slide_id, transition: slide.transition }, null, 2))
			} catch (e) {
				return err(`Error updating transition: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_update_meta -----

	server.registerTool(
		"slide_update_meta",
		{
			title: "Update Presentation Meta",
			description: `Update presentation metadata (title, dimensions).

Args:
  - file_path (string): Path to the .slide.json file
  - title (string, optional): New title
  - width (number, optional): New slide width in px
  - height (number, optional): New slide height in px

Returns: Updated meta information.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file"),
				title: z.string().optional().describe("New presentation title"),
				width: z.number().int().min(1).optional().describe("New slide width in px"),
				height: z.number().int().min(1).optional().describe("New slide height in px"),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async ({ file_path, title, width, height }) => {
			try {
				const presentation = readPresentation(file_path)
				if (title !== undefined) presentation.meta.title = title
				if (width !== undefined) presentation.meta.width = width
				if (height !== undefined) presentation.meta.height = height
				writePresentation(file_path, presentation)
				return ok(JSON.stringify({ meta: presentation.meta }, null, 2))
			} catch (e) {
				return err(`Error updating meta: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_reorder_slides -----

	server.registerTool(
		"slide_reorder_slides",
		{
			title: "Reorder Slides",
			description: `Move a slide from one position to another.

Args:
  - file_path (string): Path to the .slide.json file
  - from_index (number): Current index of the slide (0-based)
  - to_index (number): Target index (0-based)

Returns: Confirmation with the new slide order.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file"),
				from_index: z.number().int().min(0).describe("Current index of the slide (0-based)"),
				to_index: z.number().int().min(0).describe("Target index (0-based)"),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async ({ file_path, from_index, to_index }) => {
			try {
				const presentation = readPresentation(file_path)
				findSlideByIndex(presentation, from_index)
				const [moved] = presentation.slides.splice(from_index, 1)
				if (!moved) return err(`Invalid from_index: ${from_index}`)
				const targetIdx = Math.min(to_index, presentation.slides.length)
				presentation.slides.splice(targetIdx, 0, moved)
				writePresentation(file_path, presentation)
				return ok(
					JSON.stringify(
						{
							movedSlide: moved.id,
							from: from_index,
							to: targetIdx,
							order: presentation.slides.map((s) => s.id),
						},
						null,
						2,
					),
				)
			} catch (e) {
				return err(`Error reordering slides: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_add_element_animation -----

	server.registerTool(
		"slide_add_element_animation",
		{
			title: "Add Element Animation",
			description: `Add an animation to an element.

Args:
  - file_path (string): Path to the .slide.json file
  - slide_id (string): ID of the slide
  - element_id (string): ID of the element
  - animation_type (string): One of: fade-in, fade-out, slide-in-left, slide-in-right, slide-in-top, slide-in-bottom, slide-out-left, slide-out-right, slide-out-top, slide-out-bottom, rotate-in, rotate-out, scale-in, scale-out
  - duration (number, optional): Duration in seconds (default: 0.5)
  - delay (number, optional): Delay in seconds (default: 0)
  - easing (string, optional): CSS easing function (default: "ease-out")
  - trigger (string, optional): "onEnter" | "onExit" | "onClick" (default: "onEnter")
  - step_index (number, optional): Fragment step index. 0 = always visible (default: 0)

Returns: Confirmation of the added animation.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file"),
				slide_id: z.string().describe("ID of the slide"),
				element_id: z.string().describe("ID of the element"),
				animation_type: z
					.enum([
						"fade-in",
						"fade-out",
						"slide-in-left",
						"slide-in-right",
						"slide-in-top",
						"slide-in-bottom",
						"slide-out-left",
						"slide-out-right",
						"slide-out-top",
						"slide-out-bottom",
						"rotate-in",
						"rotate-out",
						"scale-in",
						"scale-out",
					])
					.describe("Animation type"),
				duration: z.number().min(0).optional().describe("Duration in seconds"),
				delay: z.number().min(0).optional().describe("Delay in seconds"),
				easing: z.string().optional().describe("CSS easing function (default: ease-out)"),
				trigger: z.enum(["onEnter", "onExit", "onClick"]).optional().describe("Trigger event"),
				step_index: z
					.number()
					.int()
					.min(0)
					.optional()
					.describe("Fragment step index (0 = always visible)"),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false,
			},
		},
		async ({
			file_path,
			slide_id,
			element_id,
			animation_type,
			duration,
			delay,
			easing,
			trigger,
			step_index,
		}) => {
			try {
				const presentation = readPresentation(file_path)
				const slide = findSlide(presentation, slide_id)
				const element = slide.elements.find((el) => el.id === element_id)
				if (!element) {
					return err(`Element not found: ${element_id}`)
				}
				const animation = {
					type: animation_type,
					duration: duration ?? 0.5,
					delay: delay ?? 0,
					easing: easing ?? "ease-out",
					trigger: trigger ?? ("onEnter" as const),
					stepIndex: step_index ?? 0,
				}
				element.animations.push(animation)
				writePresentation(file_path, presentation)
				return ok(JSON.stringify({ elementId: element_id, animation }, null, 2))
			} catch (e) {
				return err(`Error adding animation: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_list_templates -----

	server.registerTool(
		"slide_list_templates",
		{
			title: "List Slide Templates",
			description: `List all available slide templates with their IDs, names, descriptions, and categories.

Returns: Array of template summaries.`,
			inputSchema: {},
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async () => {
			const templates = SLIDE_TEMPLATES.map((t) => ({
				id: t.id,
				name: t.name,
				description: t.description,
				category: t.category,
			}))
			return ok(JSON.stringify({ templates }, null, 2))
		},
	)

	// ----- slide_add_slide_from_template -----

	server.registerTool(
		"slide_add_slide_from_template",
		{
			title: "Add Slide from Template",
			description: `Add a new slide to the presentation using a predefined template.

Args:
  - file_path (string): Path to the .slide.json file
  - template_id (string): ID of the template to use (use slide_list_templates to see available IDs)
  - insert_at (number, optional): Index to insert at (0-based). Defaults to end.

Returns: The new slide's id and its index.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file"),
				template_id: z.string().describe("ID of the template to use"),
				insert_at: z
					.number()
					.int()
					.min(0)
					.optional()
					.describe("Index to insert the slide at (0-based)"),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false,
			},
		},
		async ({ file_path, template_id, insert_at }) => {
			try {
				const template = getSlideTemplate(template_id)
				if (!template) {
					const available = SLIDE_TEMPLATES.map((t) => t.id).join(", ")
					return err(`Template not found: "${template_id}". Available templates: ${available}`)
				}
				const presentation = readPresentation(file_path)
				const colors = presentation.meta.colorSetId
					? getColorSetColors(presentation.meta.colorSetId)
					: undefined
				const newSlide = createSlideFromTemplate(template, colors ?? undefined)
				const idx = insert_at ?? presentation.slides.length
				presentation.slides.splice(idx, 0, newSlide)
				writePresentation(file_path, presentation)
				return ok(JSON.stringify({ id: newSlide.id, index: idx, template: template_id }, null, 2))
			} catch (e) {
				return err(
					`Error adding slide from template: ${e instanceof Error ? e.message : String(e)}`,
				)
			}
		},
	)

	// ----- slide_list_color_sets -----

	server.registerTool(
		"slide_list_color_sets",
		{
			title: "List Color Sets",
			description: `List all available color sets (color themes) with their IDs, names, and color values.

Returns: Array of color set summaries.`,
			inputSchema: {},
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async () => {
			const colorSets = COLOR_SETS.map((cs) => ({
				id: cs.id,
				name: cs.name,
				colors: cs.colors,
			}))
			return ok(JSON.stringify({ colorSets }, null, 2))
		},
	)

	// ----- slide_apply_color_set -----

	server.registerTool(
		"slide_apply_color_set",
		{
			title: "Apply Color Set to Presentation",
			description: `Apply a color set (color theme) to the entire presentation. Updates all slides' backgrounds and text colors.

Args:
  - file_path (string): Path to the .slide.json file
  - color_set_id (string): ID of the color set to apply (use slide_list_color_sets to see available IDs)

Returns: Confirmation with the applied color set details.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file"),
				color_set_id: z.string().describe("ID of the color set to apply"),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async ({ file_path, color_set_id }) => {
			try {
				const newColors = getColorSetColors(color_set_id)
				if (!newColors) {
					const available = COLOR_SETS.map((cs) => cs.id).join(", ")
					return err(`Color set not found: "${color_set_id}". Available: ${available}`)
				}
				const presentation = readPresentation(file_path)
				const oldColors = resolveOldColors(presentation.meta.colorSetId, null)
				presentation.slides = presentation.slides.map((slide) =>
					applyColorSetToSlide(slide, oldColors, newColors),
				)
				presentation.meta.colorSetId = color_set_id
				writePresentation(file_path, presentation)
				const result = {
					colorSetId: color_set_id,
					slidesUpdated: presentation.slides.length,
				}
				return ok(JSON.stringify(result, null, 2))
			} catch (e) {
				return err(`Error applying color set: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_apply_slide_color_set -----

	server.registerTool(
		"slide_apply_slide_color_set",
		{
			title: "Apply Color Set to Slide",
			description: `Apply a color set to a specific slide, overriding the presentation-level color set.

Args:
  - file_path (string): Path to the .slide.json file
  - slide_id (string): ID of the slide
  - color_set_id (string): ID of the color set to apply

Returns: Confirmation with the slide's updated color set.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file"),
				slide_id: z.string().describe("ID of the slide"),
				color_set_id: z.string().describe("ID of the color set to apply"),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async ({ file_path, slide_id, color_set_id }) => {
			try {
				const newColors = getColorSetColors(color_set_id)
				if (!newColors) {
					const available = COLOR_SETS.map((cs) => cs.id).join(", ")
					return err(`Color set not found: "${color_set_id}". Available: ${available}`)
				}
				const presentation = readPresentation(file_path)
				const slide = findSlide(presentation, slide_id)
				const oldColors = resolveOldColors(presentation.meta.colorSetId, slide.colorSetId)
				const updated = applyColorSetToSlide(slide, oldColors, newColors)
				updated.colorSetId = color_set_id
				const idx = presentation.slides.findIndex((s) => s.id === slide_id)
				presentation.slides[idx] = updated
				writePresentation(file_path, presentation)
				return ok(JSON.stringify({ slideId: slide_id, colorSetId: color_set_id }, null, 2))
			} catch (e) {
				return err(`Error applying slide color set: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_add_overlay_element -----

	server.registerTool(
		"slide_add_overlay_element",
		{
			title: "Add Overlay Element",
			description: `Add a persistent overlay element that stays visible across all slide transitions.

Args:
  - file_path (string): Path to the .slide.json file
  - layer (string): "background" (behind slides) or "foreground" (in front of slides)
  - element_type (string): "text" or "image"
  - content (string, optional): Text content (Markdown). Required for text elements.
  - src (string, optional): Image URL or data URI. Required for image elements.
  - x, y, width, height (number, optional): Position and size
  - font_size (number, optional): Font size for text (default: 32)
  - color (string, optional): Text color (default: "#ffffff")
  - opacity (number, optional): Opacity 0-1 (default: 1)

Returns: The new overlay element's id and layer.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file"),
				layer: z.enum(["background", "foreground"]).describe("Overlay layer"),
				element_type: z.enum(["text", "image"]).describe("Element type"),
				content: z.string().optional().describe("Text content (Markdown)"),
				src: z.string().optional().describe("Image URL or data URI"),
				x: z.number().optional().describe("X position"),
				y: z.number().optional().describe("Y position"),
				width: z.number().min(1).optional().describe("Width"),
				height: z.number().min(1).optional().describe("Height"),
				font_size: z.number().optional().describe("Font size"),
				color: z.string().optional().describe("Text color"),
				opacity: z.number().min(0).max(1).optional().describe("Opacity"),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false,
			},
		},
		async ({ file_path, layer, element_type, content, src, ...opts }) => {
			try {
				const presentation = readPresentation(file_path)
				const key =
					layer === "background" ? "overlayBackgroundElements" : "overlayForegroundElements"
				if (!presentation[key]) presentation[key] = []

				let element: Presentation["slides"][number]["elements"][number]
				if (element_type === "text") {
					element = createDefaultTextElement({
						content: content ?? "テキストを入力",
						...(opts.x != null || opts.y != null
							? { position: { x: opts.x ?? 160, y: opts.y ?? 340 } }
							: {}),
						...(opts.width != null || opts.height != null
							? { size: { width: opts.width ?? 1600, height: opts.height ?? 400 } }
							: {}),
						...(opts.opacity != null ? { opacity: opts.opacity } : {}),
						style: createDefaultTextStyle({
							...(opts.font_size != null ? { fontSize: opts.font_size } : {}),
							...(opts.color != null ? { color: opts.color } : {}),
						}),
					})
				} else {
					element = createDefaultImageElement({
						src: src ?? "",
						...(opts.x != null || opts.y != null
							? { position: { x: opts.x ?? 460, y: opts.y ?? 190 } }
							: {}),
						...(opts.width != null || opts.height != null
							? {
									size: {
										width: opts.width ?? 1000,
										height: opts.height ?? 700,
									},
								}
							: {}),
						...(opts.opacity != null ? { opacity: opts.opacity } : {}),
					})
				}

				presentation[key]?.push(element)
				writePresentation(file_path, presentation)
				return ok(JSON.stringify({ id: element.id, layer }, null, 2))
			} catch (e) {
				return err(`Error adding overlay element: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_remove_overlay_element -----

	server.registerTool(
		"slide_remove_overlay_element",
		{
			title: "Remove Overlay Element",
			description: `Remove a persistent overlay element.

Args:
  - file_path (string): Path to the .slide.json file
  - layer (string): "background" or "foreground"
  - element_id (string): ID of the overlay element to remove

Returns: Confirmation with the removed element ID.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file"),
				layer: z.enum(["background", "foreground"]).describe("Overlay layer"),
				element_id: z.string().describe("ID of the overlay element"),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: true,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async ({ file_path, layer, element_id }) => {
			try {
				const presentation = readPresentation(file_path)
				const key =
					layer === "background" ? "overlayBackgroundElements" : "overlayForegroundElements"
				const elements = presentation[key] ?? []
				const idx = elements.findIndex((el) => el.id === element_id)
				if (idx === -1) throw new Error(`Overlay element not found: ${element_id}`)
				elements.splice(idx, 1)
				presentation[key] = elements
				writePresentation(file_path, presentation)
				return ok(JSON.stringify({ removed: element_id, layer }, null, 2))
			} catch (e) {
				return err(`Error removing overlay element: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)

	// ----- slide_update_overlay_element -----

	server.registerTool(
		"slide_update_overlay_element",
		{
			title: "Update Overlay Element",
			description: `Update properties of a persistent overlay element.

Args:
  - file_path (string): Path to the .slide.json file
  - layer (string): "background" or "foreground"
  - element_id (string): ID of the overlay element
  - content, x, y, width, height, rotation, opacity, z_index, font_size, color, text_align, font_weight, font_family, src (all optional)

Returns: Confirmation with the updated element ID.`,
			inputSchema: {
				file_path: z.string().describe("Path to the .slide.json file"),
				layer: z.enum(["background", "foreground"]).describe("Overlay layer"),
				element_id: z.string().describe("ID of the overlay element"),
				content: z.string().optional().describe("Text content (Markdown)"),
				x: z.number().optional().describe("X position"),
				y: z.number().optional().describe("Y position"),
				width: z.number().min(1).optional().describe("Width"),
				height: z.number().min(1).optional().describe("Height"),
				rotation: z.number().optional().describe("Rotation in degrees"),
				opacity: z.number().min(0).max(1).optional().describe("Opacity"),
				z_index: z.number().int().optional().describe("z-index"),
				font_size: z.number().optional().describe("Font size"),
				color: z.string().optional().describe("Text color"),
				text_align: z.enum(["left", "center", "right"]).optional().describe("Text alignment"),
				font_weight: z.enum(["normal", "bold"]).optional().describe("Font weight"),
				font_family: z.string().optional().describe("Font family name"),
				src: z.string().optional().describe("Image src"),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async ({ file_path, layer, element_id, ...updates }) => {
			try {
				const presentation = readPresentation(file_path)
				const key =
					layer === "background" ? "overlayBackgroundElements" : "overlayForegroundElements"
				const elements = presentation[key] ?? []
				const element = elements.find((el) => el.id === element_id)
				if (!element) throw new Error(`Overlay element not found: ${element_id}`)

				if (updates.x != null || updates.y != null) {
					element.position = {
						x: updates.x ?? element.position.x,
						y: updates.y ?? element.position.y,
					}
				}
				if (updates.width != null || updates.height != null) {
					element.size = {
						width: updates.width ?? element.size.width,
						height: updates.height ?? element.size.height,
					}
				}
				if (updates.rotation != null) element.rotation = updates.rotation
				if (updates.opacity != null) element.opacity = updates.opacity
				if (updates.z_index != null) element.zIndex = updates.z_index

				if (element.type === "text") {
					if (updates.content != null) element.content = updates.content
					if (updates.font_size != null) element.style.fontSize = updates.font_size
					if (updates.color != null) element.style.color = updates.color
					if (updates.text_align != null) element.style.textAlign = updates.text_align
					if (updates.font_weight != null) element.style.fontWeight = updates.font_weight
					if (updates.font_family != null) element.style.fontFamily = updates.font_family
				}
				if (element.type === "image" && updates.src != null) {
					element.src = updates.src
				}

				writePresentation(file_path, presentation)
				return ok(JSON.stringify({ updated: element_id, layer }, null, 2))
			} catch (e) {
				return err(`Error updating overlay element: ${e instanceof Error ? e.message : String(e)}`)
			}
		},
	)
}
