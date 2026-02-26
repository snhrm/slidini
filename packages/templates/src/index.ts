import type { ColorSetColors, Slide, SlideElement } from "@slidini/core"
import { DEFAULT_COLOR_SET_COLORS, generateId } from "@slidini/core"
import type { SlideTemplate, SlideTemplateData, SlideTemplateElement } from "./types"

import blank from "./data/blank.json"
import bulletList from "./data/bullet-list.json"
import comparison from "./data/comparison.json"
import fullImage from "./data/full-image.json"
import imageCaption from "./data/image-caption.json"
import quote from "./data/quote.json"
import sectionDivider from "./data/section-divider.json"
import stats from "./data/stats.json"
import thankYou from "./data/thank-you.json"
import threeColumn from "./data/three-column.json"
import timeline from "./data/timeline.json"
import titleBody from "./data/title-body.json"
import titleSubtitle from "./data/title-subtitle.json"
import title from "./data/title.json"
import twoColumn from "./data/two-column.json"

export const SLIDE_TEMPLATES: SlideTemplate[] = [
	title,
	titleSubtitle,
	sectionDivider,
	blank,
	titleBody,
	bulletList,
	twoColumn,
	threeColumn,
	stats,
	timeline,
	quote,
	comparison,
	imageCaption,
	fullImage,
	thankYou,
] as SlideTemplate[]

export function getSlideTemplate(id: string): SlideTemplate | undefined {
	return SLIDE_TEMPLATES.find((t) => t.id === id)
}

export function createSlideFromTemplate(template: SlideTemplate, colors?: ColorSetColors): Slide {
	const c = colors ?? DEFAULT_COLOR_SET_COLORS

	const slide: Slide = {
		id: generateId("slide"),
		background: structuredClone(template.slide.background),
		transition: { ...template.slide.transition },
		elements: template.slide.elements.map((el) => {
			const { colorRole, bgColorRole, ...rest } = el as SlideTemplateElement & {
				colorRole?: string
				bgColorRole?: string
			}
			const element = {
				...structuredClone(rest),
				id: generateId(el.type),
			} as SlideElement

			if (element.type === "text") {
				if (colorRole && colorRole in c) {
					element.style.color = c[colorRole as keyof ColorSetColors]
				}
				if (bgColorRole && bgColorRole in c) {
					element.style.backgroundColor = c[bgColorRole as keyof ColorSetColors]
				}
			}

			return element
		}),
	}

	const bgRole = template.backgroundColorRole ?? "background"
	if (slide.background.type === "color" && bgRole in c) {
		slide.background.value = c[bgRole as keyof ColorSetColors]
	} else if (slide.background.type === "gradient") {
		slide.background.gradient.stops = slide.background.gradient.stops.map((stop, i) => ({
			...stop,
			color: i === 0 ? c.accent : c.accentSecondary,
		}))
	}

	return slide
}

export {
	COLOR_SETS,
	applyColorSetToSlide,
	getColorSet,
	getColorSetColors,
	resolveOldColors,
} from "./color-sets"

export type { SlideTemplate, SlideTemplateData, SlideTemplateElement } from "./types"
