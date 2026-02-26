import type {
	Background,
	PresentationMeta,
	SlideElement as SlideElementType,
	Slide as SlideType,
} from "@slidini/core"
import { motion } from "framer-motion"
import type React from "react"
import { useMemo } from "react"
import { useSlideTransition } from "../hooks/useSlideTransition"
import { SlideElement } from "./SlideElement"

type Props = {
	slide: SlideType
	meta: PresentationMeta
	currentStep: number
	mode: "edit" | "view"
	scale: number
	selectedElementId?: string | null
	onElementSelect?: (elementId: string | null) => void
	onElementUpdate?: (
		elementId: string,
		updates: Partial<Pick<SlideElementType, "position" | "size">>,
	) => void
}

function backgroundToStyle(bg: Background): React.CSSProperties {
	switch (bg.type) {
		case "color":
			return { backgroundColor: bg.value }
		case "image":
			return {
				backgroundImage: `url(${bg.src})`,
				backgroundSize: bg.fit === "fill" ? "100% 100%" : bg.fit,
				backgroundPosition: "center",
				backgroundRepeat: "no-repeat",
			}
		case "gradient": {
			const stops = bg.gradient.stops.map((s) => `${s.color} ${s.position}%`).join(", ")
			if (bg.gradient.kind === "linear") {
				return {
					background: `linear-gradient(${bg.gradient.angle}deg, ${stops})`,
				}
			}
			return { background: `radial-gradient(circle, ${stops})` }
		}
	}
}

export function Slide({
	slide,
	meta,
	currentStep,
	mode,
	scale,
	selectedElementId,
	onElementSelect,
	onElementUpdate,
}: Props) {
	const transitionProps = useSlideTransition(slide.transition)

	const handleBackgroundClick = () => {
		if (mode === "edit" && onElementSelect) {
			onElementSelect(null)
		}
	}

	const sortedElements = useMemo(
		() => [...slide.elements].sort((a, b) => a.zIndex - b.zIndex),
		[slide.elements],
	)

	return (
		<motion.div
			key={slide.id}
			{...transitionProps}
			onClick={handleBackgroundClick}
			style={{
				position: "relative",
				width: meta.width,
				height: meta.height,
				overflow: "hidden",
				...backgroundToStyle(slide.background),
			}}
		>
			{sortedElements.map((element) => (
				<SlideElement
					key={element.id}
					element={element}
					currentStep={currentStep}
					mode={mode}
					scale={scale}
					isSelected={selectedElementId === element.id}
					onSelect={onElementSelect}
					onElementUpdate={onElementUpdate}
				/>
			))}
		</motion.div>
	)
}
