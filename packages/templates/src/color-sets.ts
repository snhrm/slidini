import type { ColorSet, ColorSetColors, Slide } from "@slidini/core"
import { DEFAULT_COLOR_SET_COLORS } from "@slidini/core"

import coral from "./data/color-sets/coral.json"
import darkSlate from "./data/color-sets/dark-slate.json"
import lavender from "./data/color-sets/lavender.json"
import lightClean from "./data/color-sets/light-clean.json"
import midnightBlue from "./data/color-sets/midnight-blue.json"
import mint from "./data/color-sets/mint.json"
import neonDark from "./data/color-sets/neon-dark.json"
import oceanBreeze from "./data/color-sets/ocean-breeze.json"
import sakura from "./data/color-sets/sakura.json"
import sky from "./data/color-sets/sky.json"
import slate from "./data/color-sets/slate.json"
import warmNeutral from "./data/color-sets/warm-neutral.json"
import warmSunset from "./data/color-sets/warm-sunset.json"

export const COLOR_SETS: ColorSet[] = [
	lightClean,
	sakura,
	oceanBreeze,
	lavender,
	mint,
	coral,
	sky,
	slate,
	warmNeutral,
	darkSlate,
	midnightBlue,
	warmSunset,
	neonDark,
] as ColorSet[]

export function getColorSet(id: string): ColorSet | undefined {
	return COLOR_SETS.find((cs) => cs.id === id)
}

export function getColorSetColors(id: string): ColorSetColors | undefined {
	return getColorSet(id)?.colors
}

export function applyColorSetToSlide(
	slide: Slide,
	oldColors: ColorSetColors,
	newColors: ColorSetColors,
): Slide {
	const colorMap = new Map<string, string>()
	for (const key of Object.keys(oldColors) as (keyof ColorSetColors)[]) {
		colorMap.set(oldColors[key].toLowerCase(), newColors[key])
	}

	const updated = structuredClone(slide)

	if (updated.background.type === "color") {
		const mapped = colorMap.get(updated.background.value.toLowerCase())
		if (mapped) updated.background.value = mapped
	} else if (updated.background.type === "gradient") {
		for (const stop of updated.background.gradient.stops) {
			const mapped = colorMap.get(stop.color.toLowerCase())
			if (mapped) stop.color = mapped
		}
	}

	for (const el of updated.elements) {
		if (el.type === "text") {
			const mappedColor = colorMap.get(el.style.color.toLowerCase())
			if (mappedColor) el.style.color = mappedColor
			if (el.style.backgroundColor) {
				const mappedBg = colorMap.get(el.style.backgroundColor.toLowerCase())
				if (mappedBg) el.style.backgroundColor = mappedBg
			}
		} else if (el.type === "chart") {
			for (const s of el.series) {
				const mapped = colorMap.get(s.color.toLowerCase())
				if (mapped) s.color = mapped
			}
			const mappedText = colorMap.get(el.style.textColor.toLowerCase())
			if (mappedText) el.style.textColor = mappedText
			if (el.style.backgroundColor) {
				const mappedBg = colorMap.get(el.style.backgroundColor.toLowerCase())
				if (mappedBg) el.style.backgroundColor = mappedBg
			}
			el.style.categoryColors = el.style.categoryColors.map((c) => {
				const mapped = colorMap.get(c.toLowerCase())
				return mapped ?? c
			})
		}
	}

	return updated
}

export function resolveOldColors(
	metaColorSetId: string | null | undefined,
	slideColorSetId: string | null | undefined,
): ColorSetColors {
	const id = slideColorSetId ?? metaColorSetId
	if (id) {
		const colors = getColorSetColors(id)
		if (colors) return colors
	}
	return DEFAULT_COLOR_SET_COLORS
}
