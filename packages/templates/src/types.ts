import type { Background, ColorSetColors, SlideElement, SlideTransition } from "@slidini/core"

export type SlideTemplateElement = Omit<SlideElement, "id"> & {
	colorRole?: keyof ColorSetColors
	bgColorRole?: keyof ColorSetColors
}

export type SlideTemplateData = {
	background: Background
	transition: SlideTransition
	elements: SlideTemplateElement[]
}

export type SlideTemplate = {
	id: string
	name: string
	description: string
	category: "basic" | "content" | "media"
	backgroundColorRole?: keyof ColorSetColors
	slide: SlideTemplateData
}
