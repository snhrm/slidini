import type {
	AutoplayConfig,
	Background,
	ChartElement,
	ChartStyle,
	ColorSetColors,
	Gradient,
	ImageElement,
	Presentation,
	PresentationMeta,
	Slide,
	SlideTransition,
	TextElement,
	TextStyle,
	VideoElement,
} from "./types"

export function generateId(prefix: string): string {
	const random = Math.random().toString(36).slice(2, 8)
	return `${prefix}-${Date.now()}-${random}`
}

export function createDefaultMeta(overrides?: Partial<PresentationMeta>): PresentationMeta {
	const now = new Date().toISOString()
	return {
		schemaVersion: 1,
		title: "無題のプレゼンテーション",
		width: 1920,
		height: 1080,
		createdAt: now,
		updatedAt: now,
		...overrides,
	}
}

export function createDefaultBackground(): Background {
	return { type: "color", value: "#1e293b" }
}

export function createDefaultGradient(): Gradient {
	return {
		kind: "linear",
		angle: 135,
		stops: [
			{ color: "#667eea", position: 0 },
			{ color: "#764ba2", position: 100 },
		],
	}
}

export function createDefaultTransition(): SlideTransition {
	return { type: "fade", duration: 0.5, easing: "ease-out" }
}

export function createDefaultTextStyle(overrides?: Partial<TextStyle>): TextStyle {
	return {
		color: "#ffffff",
		fontSize: 32,
		fontFamily: "Noto Sans JP",
		fontWeight: "normal",
		fontStyle: "normal",
		textDecoration: "none",
		textAlign: "left",
		lineHeight: 1.5,
		backgroundColor: null,
		padding: 0,
		...overrides,
	}
}

export function createDefaultTextElement(overrides?: Partial<TextElement>): TextElement {
	return {
		id: generateId("text"),
		type: "text",
		position: { x: 160, y: 340 },
		size: { width: 1600, height: 400 },
		rotation: 0,
		opacity: 1,
		zIndex: 1,
		content: "テキストを入力",
		style: createDefaultTextStyle(),
		animations: [],
		...overrides,
	}
}

export function createDefaultImageElement(overrides?: Partial<ImageElement>): ImageElement {
	return {
		id: generateId("img"),
		type: "image",
		position: { x: 460, y: 190 },
		size: { width: 1000, height: 700 },
		rotation: 0,
		opacity: 1,
		zIndex: 1,
		src: "",
		fit: "contain",
		animations: [],
		...overrides,
	}
}

export function createDefaultVideoElement(overrides?: Partial<VideoElement>): VideoElement {
	return {
		id: generateId("video"),
		type: "video",
		position: { x: 460, y: 190 },
		size: { width: 1000, height: 700 },
		rotation: 0,
		opacity: 1,
		zIndex: 1,
		src: "",
		autoplay: false,
		loop: false,
		muted: true,
		animations: [],
		...overrides,
	}
}

export function createDefaultChartStyle(overrides?: Partial<ChartStyle>): ChartStyle {
	return {
		backgroundColor: null,
		fontSize: 14,
		fontFamily: "Noto Sans JP",
		textColor: "#94a3b8",
		gridColor: "rgba(148, 163, 184, 0.2)",
		showLegend: true,
		legendPosition: "bottom",
		showGrid: true,
		startAngle: 0,
		innerRadius: 0,
		stacked: false,
		categoryColors: [
			"#667eea",
			"#764ba2",
			"#f093fb",
			"#4facfe",
			"#00f2fe",
			"#43e97b",
			"#fa709a",
			"#fee140",
		],
		...overrides,
	}
}

export function createDefaultChartElement(overrides?: Partial<ChartElement>): ChartElement {
	return {
		id: generateId("chart"),
		type: "chart",
		position: { x: 260, y: 140 },
		size: { width: 1400, height: 800 },
		rotation: 0,
		opacity: 1,
		zIndex: 1,
		chartType: "bar",
		categories: ["1月", "2月", "3月", "4月", "5月"],
		series: [
			{ name: "売上", data: [120, 200, 150, 280, 220], color: "#667eea" },
			{ name: "利益", data: [60, 100, 80, 160, 120], color: "#764ba2" },
		],
		style: createDefaultChartStyle(),
		animations: [],
		...overrides,
	}
}

export function createDefaultSlide(overrides?: Partial<Slide>): Slide {
	return {
		id: generateId("slide"),
		background: createDefaultBackground(),
		transition: createDefaultTransition(),
		elements: [],
		...overrides,
	}
}

export function createDefaultPresentation(): Presentation {
	return {
		meta: createDefaultMeta(),
		slides: [
			createDefaultSlide({
				elements: [
					createDefaultTextElement({
						content: "# Hello World\n\nスライド作成アプリへようこそ",
						style: createDefaultTextStyle({
							fontSize: 48,
							textAlign: "center",
						}),
					}),
				],
			}),
		],
	}
}

export const DEFAULT_COLOR_SET_COLORS: ColorSetColors = {
	background: "#0f172a",
	surface: "#1e293b",
	textPrimary: "#f8fafc",
	textSecondary: "#cbd5e1",
	textMuted: "#64748b",
	accent: "#6366f1",
	accentSecondary: "#ec4899",
}

export function createDefaultAutoplayConfig(): AutoplayConfig {
	return {
		interval: 5,
		loop: false,
	}
}
