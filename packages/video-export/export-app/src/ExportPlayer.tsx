import type { Presentation as PresentationType } from "@slidini/core"
import { Presentation } from "@slidini/renderer"
import { useEffect, useState } from "react"

type SlideTiming = {
	durationMs: number
	steps: number
}

type ExportConfig = {
	presentation: PresentationType
	slideTiming: SlideTiming[]
}

declare global {
	interface Window {
		__EXPORT_CONFIG__?: ExportConfig
		__EXPORT_READY__?: boolean
		__EXPORT_DONE__?: boolean
		__EXPORT_SLIDE_INDEX__?: number
	}
}

export function ExportPlayer() {
	const config = window.__EXPORT_CONFIG__
	if (!config) {
		return <div style={{ color: "red" }}>No export config found</div>
	}

	const { presentation, slideTiming } = config
	const { meta } = presentation

	const [currentSlide, setCurrentSlide] = useState(0)
	const [currentStep, setCurrentStep] = useState(0)

	// Expose current slide index for pipeline transition detection
	window.__EXPORT_SLIDE_INDEX__ = currentSlide

	// setTimeout-based auto-advance (timeweb virtualizes these)
	useEffect(() => {
		const timing = slideTiming[currentSlide]
		if (!timing) return

		const maxStep = timing.steps
		if (currentStep < maxStep) {
			const stepInterval = timing.durationMs / (maxStep + 1)
			const timer = setTimeout(() => setCurrentStep((s) => s + 1), stepInterval)
			return () => clearTimeout(timer)
		}

		const remaining = timing.durationMs - (timing.durationMs / (maxStep + 1)) * maxStep
		const timer = setTimeout(() => {
			setCurrentSlide((s) => s + 1)
			setCurrentStep(0)
		}, remaining)
		return () => clearTimeout(timer)
	}, [currentSlide, currentStep, slideTiming])

	// Notify when fonts are ready
	useEffect(() => {
		document.fonts.ready.then(() => {
			window.__EXPORT_READY__ = true
		})
	}, [])

	// Notify when all slides are done
	if (currentSlide >= slideTiming.length) {
		window.__EXPORT_DONE__ = true
		return null
	}

	return (
		<div style={{ width: meta.width, height: meta.height }}>
			<Presentation
				data={presentation}
				currentSlide={currentSlide}
				currentStep={currentStep}
				viewMode="single"
				mode="view"
				onSlideChange={setCurrentSlide}
				onStepChange={setCurrentStep}
			/>
		</div>
	)
}
