import type { Presentation } from "@slidini/core"
import { AVAILABLE_FONTS, buildGoogleFontsUrl } from "@slidini/core"
import { useEffect, useMemo } from "react"

function collectFontFamilies(data: Presentation): string[] {
	const families = new Set<string>()

	const collectFromElements = (elements: Presentation["slides"][number]["elements"]) => {
		for (const el of elements) {
			if (el.type === "text") {
				families.add(el.style.fontFamily)
			}
			if (el.type === "chart") {
				families.add(el.style.fontFamily)
			}
		}
	}

	for (const slide of data.slides) {
		collectFromElements(slide.elements)
	}
	if (data.overlayBackgroundElements) {
		collectFromElements(data.overlayBackgroundElements)
	}
	if (data.overlayForegroundElements) {
		collectFromElements(data.overlayForegroundElements)
	}

	return Array.from(families)
}

const LINK_ID = "slidini-google-fonts"

export function useFontLoader(data: Presentation): void {
	const usedFamilies = useMemo(() => collectFontFamilies(data), [data])

	const googleFamilies = useMemo(
		() => usedFamilies.filter((f) => AVAILABLE_FONTS.some((af) => af.family === f)),
		[usedFamilies],
	)

	useEffect(() => {
		if (googleFamilies.length === 0) return

		const url = buildGoogleFontsUrl(googleFamilies)
		let link = document.getElementById(LINK_ID) as HTMLLinkElement | null
		if (link) {
			if (link.href === url) return
			link.href = url
		} else {
			link = document.createElement("link")
			link.id = LINK_ID
			link.rel = "stylesheet"
			link.href = url
			document.head.appendChild(link)
		}
	}, [googleFamilies])
}
