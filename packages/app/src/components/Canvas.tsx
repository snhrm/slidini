import type { SlideElement } from "@slidini/core"
import { Presentation } from "@slidini/renderer"
import { useCallback, useEffect } from "react"
import { useShallow } from "zustand/react/shallow"
import { usePresentationStore } from "../store/presentation"

export function Canvas() {
	const {
		presentation,
		currentSlideIndex,
		currentStep,
		viewMode,
		autoplayConfig,
		selectedElementId,
		setCurrentSlideIndex,
		setCurrentStep,
		setSelectedElementId,
		updateElement,
		removeElement,
		updateOverlayElement,
		removeOverlayElement,
	} = usePresentationStore(
		useShallow((s) => ({
			presentation: s.presentation,
			currentSlideIndex: s.currentSlideIndex,
			currentStep: s.currentStep,
			viewMode: s.viewMode,
			autoplayConfig: s.autoplayConfig,
			selectedElementId: s.selectedElementId,
			setCurrentSlideIndex: s.setCurrentSlideIndex,
			setCurrentStep: s.setCurrentStep,
			setSelectedElementId: s.setSelectedElementId,
			updateElement: s.updateElement,
			removeElement: s.removeElement,
			updateOverlayElement: s.updateOverlayElement,
			removeOverlayElement: s.removeOverlayElement,
		})),
	)
	const currentSlide = presentation.slides[currentSlideIndex]

	const findOverlayLayer = useCallback(
		(elementId: string): "background" | "foreground" | null => {
			if (presentation.overlayBackgroundElements?.some((el) => el.id === elementId))
				return "background"
			if (presentation.overlayForegroundElements?.some((el) => el.id === elementId))
				return "foreground"
			return null
		},
		[presentation.overlayBackgroundElements, presentation.overlayForegroundElements],
	)

	const handleElementUpdate = useCallback(
		(elementId: string, updates: Partial<Pick<SlideElement, "position" | "size">>) => {
			const layer = findOverlayLayer(elementId)
			if (layer) {
				updateOverlayElement(layer, elementId, updates)
			} else if (currentSlide) {
				updateElement(currentSlide.id, elementId, updates)
			}
		},
		[currentSlide, updateElement, updateOverlayElement, findOverlayLayer],
	)

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const tag = (e.target as HTMLElement).tagName
			if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return

			if (selectedElementId && (e.key === "Delete" || e.key === "Backspace")) {
				const layer = findOverlayLayer(selectedElementId)
				if (layer) {
					e.preventDefault()
					removeOverlayElement(layer, selectedElementId)
					return
				}
				if (currentSlide) {
					e.preventDefault()
					removeElement(currentSlide.id, selectedElementId)
					return
				}
			}

			if (e.key === "ArrowLeft" && currentSlideIndex > 0) {
				e.preventDefault()
				setCurrentSlideIndex(currentSlideIndex - 1)
			} else if (e.key === "ArrowRight" && currentSlideIndex < presentation.slides.length - 1) {
				e.preventDefault()
				setCurrentSlideIndex(currentSlideIndex + 1)
			}
		}
		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [
		selectedElementId,
		currentSlide,
		currentSlideIndex,
		presentation.slides.length,
		removeElement,
		removeOverlayElement,
		findOverlayLayer,
		setCurrentSlideIndex,
	])

	return (
		<div className="flex-1 bg-gray-950 overflow-hidden">
			<Presentation
				data={presentation}
				currentSlide={currentSlideIndex}
				currentStep={currentStep}
				viewMode={viewMode}
				mode="edit"
				autoplayConfig={autoplayConfig}
				selectedElementId={selectedElementId}
				onSlideChange={setCurrentSlideIndex}
				onStepChange={setCurrentStep}
				onElementSelect={setSelectedElementId}
				onElementUpdate={handleElementUpdate}
			/>
		</div>
	)
}
