import { z } from "zod"
import { ANIMATION_TYPES } from "./animations"

// ===== 基本型 =====

const gradientStopSchema = z.object({
	color: z.string(),
	position: z.number().min(0).max(100),
})

const gradientSchema = z.object({
	kind: z.enum(["linear", "radial"]),
	angle: z.number(),
	stops: z.array(gradientStopSchema).min(2),
})

const backgroundSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("color"),
		value: z.string(),
	}),
	z.object({
		type: z.literal("image"),
		src: z.string(),
		fit: z.enum(["cover", "contain", "fill"]),
	}),
	z.object({
		type: z.literal("gradient"),
		gradient: gradientSchema,
	}),
])

const slideTransitionTypeSchema = z.enum([
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
	"cube-left",
	"cube-right",
	"cube-up",
	"cube-down",
	"page-turn",
	"portal",
])

const slideShapeSchema = z.enum(["rectangle", "circle", "rounded"])

const slideTransitionSchema = z.object({
	type: slideTransitionTypeSchema,
	duration: z.number().min(0),
	easing: z.string(),
})

// ===== アニメーション =====

const animationTypeSchema = z.enum(ANIMATION_TYPES)

const animationSchema = z.object({
	type: animationTypeSchema,
	duration: z.number().min(0),
	delay: z.number().min(0),
	easing: z.string(),
	trigger: z.enum(["onEnter", "onExit", "onClick"]),
	stepIndex: z.number().int().min(0),
})

// ===== 要素 =====

const baseElementSchema = z.object({
	id: z.string(),
	position: z.object({ x: z.number(), y: z.number() }),
	size: z.object({ width: z.number().min(0), height: z.number().min(0) }),
	rotation: z.number(),
	opacity: z.number().min(0).max(1),
	zIndex: z.number().int(),
	animations: z.array(animationSchema),
})

const textStyleSchema = z.object({
	color: z.string(),
	fontSize: z.number().min(1),
	fontFamily: z.string(),
	fontWeight: z.enum(["normal", "bold"]),
	fontStyle: z.enum(["normal", "italic"]),
	textDecoration: z.enum(["none", "underline", "line-through"]),
	textAlign: z.enum(["left", "center", "right"]),
	lineHeight: z.number().min(0),
	backgroundColor: z.string().nullable(),
	padding: z.number().min(0),
})

const textElementSchema = baseElementSchema.extend({
	type: z.literal("text"),
	content: z.string(),
	style: textStyleSchema,
})

const imageElementSchema = baseElementSchema.extend({
	type: z.literal("image"),
	src: z.string(),
	fit: z.enum(["cover", "contain", "fill"]),
})

const videoElementSchema = baseElementSchema.extend({
	type: z.literal("video"),
	src: z.string(),
	autoplay: z.boolean(),
	loop: z.boolean(),
	muted: z.boolean(),
})

const chartTypeSchema = z.enum(["bar", "line", "pie", "donut", "area", "radar"])

const chartSeriesSchema = z.object({
	name: z.string(),
	data: z.array(z.number()),
	color: z.string(),
})

const chartStyleSchema = z.object({
	backgroundColor: z.string().nullable(),
	fontSize: z.number().min(1),
	fontFamily: z.string(),
	textColor: z.string(),
	gridColor: z.string(),
	showLegend: z.boolean(),
	legendPosition: z.enum(["top", "bottom", "left", "right"]),
	showGrid: z.boolean(),
	startAngle: z.number(),
	innerRadius: z.number().min(0).max(100),
	stacked: z.boolean(),
	categoryColors: z.array(z.string()),
})

const chartElementSchema = baseElementSchema.extend({
	type: z.literal("chart"),
	chartType: chartTypeSchema,
	categories: z.array(z.string()),
	series: z.array(chartSeriesSchema).min(1),
	style: chartStyleSchema,
})

const slideElementSchema = z.discriminatedUnion("type", [
	textElementSchema,
	imageElementSchema,
	videoElementSchema,
	chartElementSchema,
])

// ===== スライド =====

const slideSchema = z.object({
	id: z.string(),
	shape: slideShapeSchema.optional(),
	background: backgroundSchema,
	transition: slideTransitionSchema,
	elements: z.array(slideElementSchema),
	colorSetId: z.string().nullable().optional(),
})

// ===== メタ =====

const presentationMetaSchema = z.object({
	schemaVersion: z.number().int().min(1),
	title: z.string(),
	width: z.number().int().min(1),
	height: z.number().int().min(1),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
	colorSetId: z.string().nullable().optional(),
})

// ===== 再生設定 =====

const slidePlaybackConfigSchema = z.object({
	slideIndex: z.number().int().min(0),
	narration: z.string().optional(),
	audioFile: z.string().optional(),
	duration: z.number().min(0).nullable().optional(),
})

const bgmPlaybackConfigSchema = z.object({
	src: z.string(),
	volume: z.number().min(0).max(1),
	loop: z.boolean(),
	fadeIn: z.number().min(0),
	fadeOut: z.number().min(0),
	startTime: z.number().min(0).optional(),
	endTime: z.number().min(0).optional(),
})

const playerConfigSchema = z.object({
	defaultSlideDuration: z.number().min(0),
	defaultStepDelay: z.number().min(0),
	slides: z.array(slidePlaybackConfigSchema),
	bgm: z.array(bgmPlaybackConfigSchema),
})

// ===== プレゼンテーション =====

export const presentationSchema = z.object({
	meta: presentationMetaSchema,
	slides: z.array(slideSchema),
	overlayBackgroundElements: z.array(slideElementSchema).optional(),
	overlayForegroundElements: z.array(slideElementSchema).optional(),
	playback: playerConfigSchema.optional(),
})

export type ParseResult =
	| { success: true; data: z.infer<typeof presentationSchema> }
	| { success: false; error: z.ZodError }

export function parsePresentation(data: unknown): ParseResult {
	const result = presentationSchema.safeParse(data)
	if (result.success) {
		return { success: true, data: result.data }
	}
	return { success: false, error: result.error }
}
