import type {
	Background,
	PresentationMeta,
	SlideElement as SlideElementType,
	SlideShape,
	Slide as SlideType,
} from "@slidini/core"
import { motion } from "framer-motion"
import type React from "react"
import { useMemo } from "react"
import {
	getCubeTransformOrigin,
	is3DTransition,
	useSlideTransition,
} from "../hooks/useSlideTransition"
import { SlideElement } from "./SlideElement"

type Props = {
	slide: SlideType
	meta: PresentationMeta
	currentStep: number
	mode: "edit" | "view"
	scale: number
	useAbsolutePosition?: boolean
	isExiting?: boolean
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

function getShapeStyle(
	shape: SlideShape | undefined,
	width: number,
	height: number,
): React.CSSProperties {
	switch (shape) {
		case "circle": {
			const r = Math.min(width, height) / 2
			return { clipPath: `circle(${r}px at ${width / 2}px ${height / 2}px)` }
		}
		case "rounded":
			return { borderRadius: 48 }
		default:
			return {}
	}
}

export function Slide({
	slide,
	meta,
	currentStep,
	mode,
	scale,
	useAbsolutePosition,
	isExiting,
	selectedElementId,
	onElementSelect,
	onElementUpdate,
}: Props) {
	const transitionProps = useSlideTransition(slide.transition)
	const is3D = is3DTransition(slide.transition.type)
	const cubeOrigin = getCubeTransformOrigin(slide.transition.type, !isExiting)

	const handleBackgroundClick = () => {
		if (mode === "edit" && onElementSelect) {
			onElementSelect(null)
		}
	}

	const sortedElements = useMemo(
		() => [...slide.elements].sort((a, b) => a.zIndex - b.zIndex),
		[slide.elements],
	)

	const shapeStyle = getShapeStyle(slide.shape, meta.width, meta.height)

	return (
		<motion.div
			key={slide.id}
			initial={isExiting ? transitionProps.animate : transitionProps.initial}
			animate={isExiting ? transitionProps.exit : transitionProps.animate}
			transition={transitionProps.transition}
			onClick={handleBackgroundClick}
			style={{
				position: useAbsolutePosition ? "absolute" : "relative",
				...(useAbsolutePosition ? { top: 0, left: 0, zIndex: 1 } : {}),
				width: meta.width,
				height: meta.height,
				overflow: "hidden",
				...backgroundToStyle(slide.background),
				...shapeStyle,
				...(is3D ? { backfaceVisibility: "hidden" as const } : {}),
				...(cubeOrigin ? { transformOrigin: cubeOrigin } : {}),
			}}
		>
			{sortedElements.map((element) => (
				<SlideElement
					key={element.id}
					element={element}
					currentStep={currentStep}
					mode={mode}
					scale={scale}
					isExiting={isExiting}
					isSelected={selectedElementId === element.id}
					onSelect={onElementSelect}
					onElementUpdate={onElementUpdate}
				/>
			))}
		</motion.div>
	)
}
