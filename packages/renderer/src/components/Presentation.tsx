import type {
	AutoplayConfig,
	Presentation as PresentationType,
	Slide as SlideType,
	SlideElement as SlideElementType,
	ViewMode,
} from "@slidini/core"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { is3DTransition } from "../hooks/useSlideTransition"
import { Slide } from "./Slide"
import { SlideElement } from "./SlideElement"

export type PresentationProps = {
	data: PresentationType
	currentSlide: number
	currentStep: number
	viewMode: ViewMode
	mode: "edit" | "view"
	autoplayConfig?: AutoplayConfig
	selectedElementId?: string | null
	onSlideChange?: (index: number) => void
	onStepChange?: (step: number) => void
	onElementSelect?: (elementId: string | null) => void
	onElementUpdate?: (
		elementId: string,
		updates: Partial<Pick<SlideElementType, "position" | "size">>,
	) => void
}

export function Presentation({
	data,
	currentSlide,
	currentStep,
	viewMode,
	mode,
	autoplayConfig,
	selectedElementId,
	onSlideChange,
	onStepChange,
	onElementSelect,
	onElementUpdate,
}: PresentationProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [scale, setScale] = useState(1)
	const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const [autoplayRunning, setAutoplayRunning] = useState(viewMode === "autoplay")

	const { meta, slides } = data
	const bgOverlay = useMemo(
		() => [...(data.overlayBackgroundElements ?? [])].sort((a, b) => a.zIndex - b.zIndex),
		[data.overlayBackgroundElements],
	)
	const fgOverlay = useMemo(
		() => [...(data.overlayForegroundElements ?? [])].sort((a, b) => a.zIndex - b.zIndex),
		[data.overlayForegroundElements],
	)

	// Viewport scaling
	useEffect(() => {
		const container = containerRef.current
		if (!container || viewMode === "overview") return

		const updateScale = () => {
			const containerWidth = container.clientWidth
			const containerHeight = container.clientHeight
			const scaleX = containerWidth / meta.width
			const scaleY = containerHeight / meta.height
			setScale(Math.min(scaleX, scaleY))
		}

		const observer = new ResizeObserver(updateScale)
		observer.observe(container)
		updateScale()

		return () => observer.disconnect()
	}, [meta.width, meta.height, viewMode])
	const currentSlideData = slides[currentSlide]

	// Autoplay
	useEffect(() => {
		if (viewMode !== "autoplay" || !autoplayConfig || !autoplayRunning) {
			if (autoplayTimerRef.current) {
				clearInterval(autoplayTimerRef.current)
				autoplayTimerRef.current = null
			}
			return
		}

		autoplayTimerRef.current = setInterval(() => {
			const nextIndex = currentSlide + 1
			if (nextIndex >= slides.length) {
				if (autoplayConfig.loop) {
					onSlideChange?.(0)
				} else {
					setAutoplayRunning(false)
				}
			} else {
				onSlideChange?.(nextIndex)
			}
		}, autoplayConfig.interval * 1000)

		return () => {
			if (autoplayTimerRef.current) {
				clearInterval(autoplayTimerRef.current)
			}
		}
	}, [viewMode, autoplayConfig, autoplayRunning, currentSlide, slides.length, onSlideChange])

	// Keyboard navigation
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (mode === "edit") return

			switch (e.key) {
				case "ArrowRight":
				case " ": {
					e.preventDefault()
					if (viewMode === "autoplay" && autoplayRunning) {
						setAutoplayRunning(false)
						return
					}
					// Fragment (step) advancement
					if (currentSlideData) {
						const maxStep = getMaxStepForSlide(currentSlideData)
						if (currentStep < maxStep) {
							onStepChange?.(currentStep + 1)
							return
						}
					}
					if (currentSlide < slides.length - 1) {
						onSlideChange?.(currentSlide + 1)
						onStepChange?.(0)
					}
					break
				}
				case "ArrowLeft": {
					e.preventDefault()
					if (viewMode === "autoplay" && autoplayRunning) {
						setAutoplayRunning(false)
						return
					}
					if (currentStep > 0) {
						onStepChange?.(currentStep - 1)
						return
					}
					if (currentSlide > 0) {
						onSlideChange?.(currentSlide - 1)
						onStepChange?.(0)
					}
					break
				}
			}
		},
		[
			mode,
			viewMode,
			autoplayRunning,
			currentSlide,
			currentStep,
			currentSlideData,
			slides.length,
			onSlideChange,
			onStepChange,
		],
	)

	useEffect(() => {
		if (mode === "view") {
			window.addEventListener("keydown", handleKeyDown)
			return () => window.removeEventListener("keydown", handleKeyDown)
		}
	}, [mode, handleKeyDown])

	const renderOverlayLayer = (elements: SlideElementType[], zIndex: number) => {
		if (elements.length === 0) return null
		return (
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: meta.width,
					height: meta.height,
					zIndex,
					pointerEvents: "none",
				}}
			>
				{elements.map((el) => (
					<SlideElement
						key={el.id}
						element={el}
						currentStep={currentStep}
						mode={mode}
						scale={scale}
						isSelected={selectedElementId === el.id}
						onSelect={onElementSelect}
						onElementUpdate={onElementUpdate}
					/>
				))}
			</div>
		)
	}

	// Overview mode
	if (viewMode === "overview") {
		return (
			<div
				ref={containerRef}
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
					gap: 12,
					padding: 12,
					width: "100%",
					height: "100%",
					overflow: "auto",
					backgroundColor: "#111",
				}}
			>
				{slides.map((slide, index) => (
					<button
						type="button"
						key={slide.id}
						onClick={() => onSlideChange?.(index)}
						style={{
							cursor: "pointer",
							borderRadius: 6,
							overflow: "hidden",
							border: index === currentSlide ? "2px solid #3b82f6" : "2px solid transparent",
							aspectRatio: `${meta.width}/${meta.height}`,
							padding: 0,
							background: "none",
							position: "relative",
						}}
					>
						<div
							style={{
								position: "absolute",
								top: 0,
								left: 0,
								transform: `scale(${240 / meta.width})`,
								transformOrigin: "top left",
								width: meta.width,
								height: meta.height,
								pointerEvents: "none",
							}}
						>
							<Slide slide={slide} meta={meta} currentStep={0} mode="view" scale={1} />
						</div>
					</button>
				))}
			</div>
		)
	}

	// Manage exiting slide manually (replaces AnimatePresence)
	const [exitingSlide, setExitingSlide] = useState<SlideType | null>(null)
	const prevSlideIdRef = useRef(currentSlideData?.id)

	useEffect(() => {
		if (!currentSlideData || prevSlideIdRef.current === currentSlideData.id) return
		const prevId = prevSlideIdRef.current
		prevSlideIdRef.current = currentSlideData.id
		if (prevId) {
			const prev = slides.find((s) => s.id === prevId)
			if (prev) setExitingSlide(prev)
		}
	}, [currentSlideData, slides])

	useEffect(() => {
		if (!exitingSlide) return
		const duration = exitingSlide.transition.duration
		const timer = setTimeout(() => setExitingSlide(null), duration * 1000 + 100)
		return () => clearTimeout(timer)
	}, [exitingSlide])

	// Single / Autoplay mode
	if (!currentSlideData) return null

	const needs3D =
		is3DTransition(currentSlideData.transition.type) ||
		(exitingSlide ? is3DTransition(exitingSlide.transition.type) : false)

	return (
		<div
			ref={containerRef}
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				overflow: "hidden",
				backgroundColor: "#000",
			}}
		>
			<div
				style={{
					transform: `scale(${scale})`,
					transformOrigin: "center center",
					position: "relative",
					width: meta.width,
					height: meta.height,
					flexShrink: 0,
					...(needs3D
						? { perspective: 1200, transformStyle: "preserve-3d" as const }
						: {}),
				}}
			>
				{renderOverlayLayer(bgOverlay, 0)}

				{exitingSlide && (
					<Slide
						key={`exit-${exitingSlide.id}`}
						slide={exitingSlide}
						meta={meta}
						currentStep={currentStep}
						mode={mode}
						scale={scale}
						useAbsolutePosition
						isExiting
					/>
				)}

				<Slide
					key={currentSlideData.id}
					slide={currentSlideData}
					meta={meta}
					currentStep={currentStep}
					mode={mode}
					scale={scale}
					useAbsolutePosition
					selectedElementId={selectedElementId}
					onElementSelect={onElementSelect}
					onElementUpdate={onElementUpdate}
				/>

				{renderOverlayLayer(fgOverlay, 2)}
			</div>

			{viewMode === "autoplay" && !autoplayRunning && (
				<button
					type="button"
					onClick={() => setAutoplayRunning(true)}
					style={{
						position: "absolute",
						bottom: 24,
						right: 24,
						padding: "8px 16px",
						backgroundColor: "#3b82f6",
						color: "white",
						border: "none",
						borderRadius: 6,
						cursor: "pointer",
						fontSize: 14,
					}}
				>
					再開
				</button>
			)}
		</div>
	)
}

function getMaxStepForSlide(slide: {
	elements: { animations: { stepIndex: number }[] }[]
}): number {
	let max = 0
	for (const el of slide.elements) {
		for (const anim of el.animations) {
			if (anim.stepIndex > max) max = anim.stepIndex
		}
	}
	return max
}
