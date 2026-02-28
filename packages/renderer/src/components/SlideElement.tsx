import type { SlideElement as SlideElementType } from "@slidini/core"
import { memo, useRef } from "react"
import { ChartElement } from "./ChartElement"
import { ImageElement } from "./ImageElement"
import { TextElement } from "./TextElement"
import { VideoElement } from "./VideoElement"

type Props = {
	element: SlideElementType
	currentStep: number
	mode: "edit" | "view"
	scale: number
	isExiting?: boolean
	isSelected?: boolean
	onSelect?: (elementId: string | null) => void
	onElementUpdate?: (
		elementId: string,
		updates: Partial<Pick<SlideElementType, "position" | "size">>,
	) => void
}

type DragState = {
	type: "move" | "resize"
	startX: number
	startY: number
	origX: number
	origY: number
	origW: number
	origH: number
	handle?: string
}

export const SlideElement = memo(function SlideElement({
	element,
	currentStep,
	mode,
	scale,
	isExiting,
	isSelected,
	onSelect,
	onElementUpdate,
}: Props) {
	const dragRef = useRef<DragState | null>(null)

	const handleClick = (e: React.MouseEvent) => {
		if (mode === "edit" && onSelect) {
			e.stopPropagation()
			onSelect(element.id)
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (mode === "edit" && onSelect && (e.key === "Enter" || e.key === " ")) {
			e.preventDefault()
			e.stopPropagation()
			onSelect(element.id)
		}
	}

	const handlePointerDown = (e: React.PointerEvent) => {
		if (mode !== "edit" || !onElementUpdate) return
		// resize handles have their own handler
		if ((e.target as HTMLElement).dataset.handle) return

		e.stopPropagation()
		e.preventDefault()
		;(e.target as HTMLElement).setPointerCapture(e.pointerId)

		onSelect?.(element.id)

		dragRef.current = {
			type: "move",
			startX: e.clientX,
			startY: e.clientY,
			origX: element.position.x,
			origY: element.position.y,
			origW: element.size.width,
			origH: element.size.height,
		}
	}

	const handlePointerMove = (e: React.PointerEvent) => {
		const drag = dragRef.current
		if (!drag || !onElementUpdate) return

		const dx = (e.clientX - drag.startX) / scale
		const dy = (e.clientY - drag.startY) / scale

		if (drag.type === "move") {
			onElementUpdate(element.id, {
				position: {
					x: Math.round(drag.origX + dx),
					y: Math.round(drag.origY + dy),
				},
			})
		} else if (drag.type === "resize" && drag.handle) {
			const h = drag.handle
			let newX = drag.origX
			let newY = drag.origY
			let newW = drag.origW
			let newH = drag.origH

			if (h.includes("e")) newW = Math.max(20, drag.origW + dx)
			if (h.includes("s")) newH = Math.max(20, drag.origH + dy)
			if (h.includes("w")) {
				newW = Math.max(20, drag.origW - dx)
				newX = drag.origX + drag.origW - newW
			}
			if (h.includes("n")) {
				newH = Math.max(20, drag.origH - dy)
				newY = drag.origY + drag.origH - newH
			}

			onElementUpdate(element.id, {
				position: { x: Math.round(newX), y: Math.round(newY) },
				size: { width: Math.round(newW), height: Math.round(newH) },
			})
		}
	}

	const handlePointerUp = () => {
		dragRef.current = null
	}

	const handleResizePointerDown = (handle: string, e: React.PointerEvent) => {
		if (mode !== "edit" || !onElementUpdate) return

		e.stopPropagation()
		e.preventDefault()
		;(e.target as HTMLElement).setPointerCapture(e.pointerId)

		dragRef.current = {
			type: "resize",
			handle,
			startX: e.clientX,
			startY: e.clientY,
			origX: element.position.x,
			origY: element.position.y,
			origW: element.size.width,
			origH: element.size.height,
		}
	}

	return (
		<div
			style={{
				position: "absolute",
				left: element.position.x,
				top: element.position.y,
				width: element.size.width,
				height: element.size.height,
				transform: element.rotation !== 0 ? `rotate(${element.rotation}deg)` : undefined,
				opacity: element.opacity,
				zIndex: element.zIndex,
				outline: mode === "edit" && isSelected ? "2px solid #3b82f6" : undefined,
				outlineOffset: mode === "edit" && isSelected ? 2 : undefined,
			}}
		>
			{element.type === "text" && (
				<TextElement element={element} currentStep={currentStep} isExiting={isExiting} />
			)}
			{element.type === "image" && (
				<ImageElement element={element} currentStep={currentStep} isExiting={isExiting} />
			)}
			{element.type === "video" && (
				<VideoElement element={element} currentStep={currentStep} isExiting={isExiting} />
			)}
			{element.type === "chart" && (
				<ChartElement element={element} currentStep={currentStep} isExiting={isExiting} />
			)}

			{mode === "edit" && (
				<div
					onClick={handleClick}
					onKeyDown={handleKeyDown}
					onPointerDown={handlePointerDown}
					onPointerMove={handlePointerMove}
					onPointerUp={handlePointerUp}
					style={{
						position: "absolute",
						inset: 0,
						cursor: "move",
						userSelect: "none",
						touchAction: "none",
						pointerEvents: "auto",
					}}
				/>
			)}

			{mode === "edit" && isSelected && (
				<ResizeHandles
					onPointerDown={handleResizePointerDown}
					onPointerMove={handlePointerMove}
					onPointerUp={handlePointerUp}
				/>
			)}
		</div>
	)
})

function ResizeHandles({
	onPointerDown,
	onPointerMove,
	onPointerUp,
}: {
	onPointerDown: (handle: string, e: React.PointerEvent) => void
	onPointerMove: (e: React.PointerEvent) => void
	onPointerUp: () => void
}) {
	const HANDLE_SIZE = 8
	const HANDLE_OFFSET = -(HANDLE_SIZE / 2)

	const handleStyle: React.CSSProperties = {
		position: "absolute",
		width: HANDLE_SIZE,
		height: HANDLE_SIZE,
		backgroundColor: "#3b82f6",
		border: "1px solid white",
		borderRadius: 1,
		touchAction: "none",
		pointerEvents: "auto",
	}

	const handles = [
		{ handle: "nw", style: { top: HANDLE_OFFSET, left: HANDLE_OFFSET, cursor: "nw-resize" } },
		{ handle: "ne", style: { top: HANDLE_OFFSET, right: HANDLE_OFFSET, cursor: "ne-resize" } },
		{
			handle: "sw",
			style: { bottom: HANDLE_OFFSET, left: HANDLE_OFFSET, cursor: "sw-resize" },
		},
		{
			handle: "se",
			style: { bottom: HANDLE_OFFSET, right: HANDLE_OFFSET, cursor: "se-resize" },
		},
		{
			handle: "n",
			style: {
				top: HANDLE_OFFSET,
				left: "50%",
				marginLeft: HANDLE_OFFSET,
				cursor: "n-resize",
			},
		},
		{
			handle: "s",
			style: {
				bottom: HANDLE_OFFSET,
				left: "50%",
				marginLeft: HANDLE_OFFSET,
				cursor: "s-resize",
			},
		},
		{
			handle: "w",
			style: {
				left: HANDLE_OFFSET,
				top: "50%",
				marginTop: HANDLE_OFFSET,
				cursor: "w-resize",
			},
		},
		{
			handle: "e",
			style: {
				right: HANDLE_OFFSET,
				top: "50%",
				marginTop: HANDLE_OFFSET,
				cursor: "e-resize",
			},
		},
	]

	return (
		<>
			{handles.map((h) => (
				<div
					key={h.handle}
					data-handle={h.handle}
					style={{ ...handleStyle, ...h.style }}
					onPointerDown={(e) => onPointerDown(h.handle, e)}
					onPointerMove={onPointerMove}
					onPointerUp={onPointerUp}
				/>
			))}
		</>
	)
}
