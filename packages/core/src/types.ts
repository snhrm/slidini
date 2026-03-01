// ===== プレゼンテーション =====

import type { PlayerConfig } from "./playback"

export type Presentation = {
	meta: PresentationMeta
	slides: Slide[]
	overlayBackgroundElements?: SlideElement[]
	overlayForegroundElements?: SlideElement[]
	playback?: PlayerConfig
}

export type PresentationMeta = {
	schemaVersion: number
	title: string
	width: number // default: 1920
	height: number // default: 1080
	createdAt: string // ISO 8601
	updatedAt: string // ISO 8601
	colorSetId?: string | null
}

// ===== スライド =====

export type SlideShape = "rectangle" | "circle" | "rounded"

export type Slide = {
	id: string
	shape?: SlideShape
	background: Background
	transition: SlideTransition
	elements: SlideElement[]
	colorSetId?: string | null
}

export type Background =
	| { type: "color"; value: string }
	| { type: "image"; src: string; fit: "cover" | "contain" | "fill" }
	| { type: "gradient"; gradient: Gradient }

export type Gradient = {
	kind: "linear" | "radial"
	angle: number // linear のみ (degrees)
	stops: GradientStop[]
}

export type GradientStop = {
	color: string
	position: number // 0-100 (%)
}

// ===== スライド間トランジション =====

export type SlideTransition = {
	type: SlideTransitionType
	duration: number // seconds
	easing: string
}

export type SlideTransitionType =
	| "none"
	| "fade"
	| "slide-left"
	| "slide-right"
	| "slide-up"
	| "slide-down"
	| "zoom"
	| "flip-x"
	| "flip-y"
	| "rotate"
	| "scale-fade"
	| "wipe-left"
	| "wipe-right"
	| "wipe-up"
	| "wipe-down"
	| "cube-left"
	| "cube-right"
	| "cube-up"
	| "cube-down"
	| "page-turn"
	| "portal"

// ===== チャート =====

export type ChartType = "bar" | "line" | "pie" | "donut" | "area" | "radar"

export type ChartSeries = {
	name: string
	data: number[]
	color: string
}

export type ChartStyle = {
	backgroundColor: string | null
	fontSize: number
	fontFamily: string
	textColor: string
	gridColor: string
	showLegend: boolean
	legendPosition: "top" | "bottom" | "left" | "right"
	showGrid: boolean
	startAngle: number
	innerRadius: number // 0 = pie, >0 = donut (percentage 0-100)
	stacked: boolean
	categoryColors: string[]
}

// ===== 要素 =====

export type SlideElement = TextElement | ImageElement | VideoElement | ChartElement

export type BaseElement = {
	id: string
	position: { x: number; y: number }
	size: { width: number; height: number }
	rotation: number // degrees
	opacity: number // 0-1
	zIndex: number
	animations: Animation[]
}

export type TextElement = BaseElement & {
	type: "text"
	content: string // Markdown 形式
	style: TextStyle
}

export type TextStyle = {
	color: string
	fontSize: number
	fontFamily: string
	fontWeight: "normal" | "bold"
	fontStyle: "normal" | "italic"
	textDecoration: "none" | "underline" | "line-through"
	textAlign: "left" | "center" | "right"
	lineHeight: number
	backgroundColor: string | null
	padding: number
}

export type ImageElement = BaseElement & {
	type: "image"
	src: string // URL or data URI (Base64)
	fit: "cover" | "contain" | "fill"
}

export type VideoElement = BaseElement & {
	type: "video"
	src: string // URL or data URI (Base64)
	autoplay: boolean
	loop: boolean
	muted: boolean
}

export type ChartElement = BaseElement & {
	type: "chart"
	chartType: ChartType
	categories: string[]
	series: ChartSeries[]
	style: ChartStyle
}

// ===== 要素アニメーション =====

export type Animation = {
	type: AnimationType
	duration: number // seconds
	delay: number // seconds
	easing: string // CSS easing function
	trigger: "onEnter" | "onExit" | "onClick"
	stepIndex: number // Fragment: 同じstepIndexの要素が同時に表示 (0 = 常に表示)
}

export type AnimationType =
	| "fade-in"
	| "fade-out"
	| "slide-in-left"
	| "slide-in-right"
	| "slide-in-top"
	| "slide-in-bottom"
	| "slide-out-left"
	| "slide-out-right"
	| "slide-out-top"
	| "slide-out-bottom"
	| "rotate-in"
	| "rotate-out"
	| "scale-in"
	| "scale-out"
	| "bounce-in"
	| "bounce-out"
	| "elastic-in"
	| "elastic-out"
	| "flip-in"
	| "flip-out"
	| "drop-in"
	| "drop-out"
	| "float"
	| "pulse"

// ===== カラーセット =====

export type ColorSetColors = {
	background: string
	surface: string
	textPrimary: string
	textSecondary: string
	textMuted: string
	accent: string
	accentSecondary: string
}

export type ColorSet = {
	id: string
	name: string
	colors: ColorSetColors
}

// ===== 表示モード =====

export type ViewMode = "single" | "overview" | "autoplay"

export type AutoplayConfig = {
	interval: number // seconds
	loop: boolean
}

export type AutoplayState = "running" | "paused" | "stopped"
