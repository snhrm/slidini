export type {
	Animation,
	AnimationType,
	AutoplayConfig,
	AutoplayState,
	Background,
	BaseElement,
	ChartElement,
	ChartSeries,
	ChartStyle,
	ChartType,
	ColorSet,
	ColorSetColors,
	Gradient,
	GradientStop,
	ImageElement,
	Presentation,
	PresentationMeta,
	Slide,
	SlideElement,
	SlideShape,
	SlideTransition,
	SlideTransitionType,
	TextElement,
	TextStyle,
	VideoElement,
	ViewMode,
} from "./types"

export {
	ANIMATION_LABELS,
	ANIMATION_TYPES,
	createDefaultAnimation,
} from "./animations"

export {
	DEFAULT_COLOR_SET_COLORS,
	createDefaultAutoplayConfig,
	createDefaultBackground,
	createDefaultChartElement,
	createDefaultChartStyle,
	createDefaultGradient,
	createDefaultImageElement,
	createDefaultMeta,
	createDefaultPresentation,
	createDefaultSlide,
	createDefaultTextElement,
	createDefaultTextStyle,
	createDefaultTransition,
	createDefaultVideoElement,
	generateId,
} from "./defaults"

export { parsePresentation, presentationSchema } from "./schema"
export type { ParseResult } from "./schema"
