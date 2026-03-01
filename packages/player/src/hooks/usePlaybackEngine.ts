import type { PlayerConfig, Presentation, SlideTiming } from "@slidini/core"
import { getMaxStepIndex } from "@slidini/renderer"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

export type PlaybackState = {
	isPlaying: boolean
	currentTimeMs: number
	totalDurationMs: number
	currentSlideIndex: number
	currentStep: number
}

export type PlaybackActions = {
	play: () => void
	pause: () => void
	togglePlayPause: () => void
	seek: (timeMs: number) => void
	seekToSlide: (slideIndex: number) => void
}

export function computeSlideTimings(
	presentation: Presentation,
	playerConfig?: PlayerConfig,
): SlideTiming[] {
	const defaultDurationMs = (playerConfig?.defaultSlideDuration ?? 5) * 1000
	const defaultStepDelay = (playerConfig?.defaultStepDelay ?? 1) * 1000
	const timings: SlideTiming[] = []
	let currentTimeMs = 0

	for (let i = 0; i < presentation.slides.length; i++) {
		const slide = presentation.slides[i]
		if (!slide) continue

		const slideConfig = playerConfig?.slides.find((s) => s.slideIndex === i)

		const maxStep = slide.elements.reduce(
			(max, el) => Math.max(max, getMaxStepIndex(el.animations)),
			0,
		)

		let durationMs: number
		if (slideConfig?.duration !== undefined) {
			if (slideConfig.duration === null) {
				// null = auto from audio (fallback to default if no audio)
				durationMs = defaultDurationMs
			} else {
				durationMs = slideConfig.duration * 1000
			}
		} else {
			durationMs = defaultDurationMs
		}

		// Compute step timings within the slide
		const stepCount = maxStep + 1
		const stepInterval = durationMs / stepCount
		const stepTimings: number[] = []
		for (let s = 0; s < stepCount; s++) {
			stepTimings.push(currentTimeMs + s * stepInterval)
		}

		timings.push({
			slideIndex: i,
			startTimeMs: currentTimeMs,
			durationMs,
			maxStep,
			stepTimings,
		})

		currentTimeMs += durationMs
	}

	return timings
}

export function usePlaybackEngine(
	presentation: Presentation,
	playerConfig?: PlayerConfig,
): PlaybackState & PlaybackActions {
	const [isPlaying, setIsPlaying] = useState(false)
	const [currentTimeMs, setCurrentTimeMs] = useState(0)
	const rafRef = useRef<number | null>(null)
	const lastFrameRef = useRef<number>(0)

	const slideTimings = useMemo(
		() => computeSlideTimings(presentation, playerConfig),
		[presentation, playerConfig],
	)

	const totalDurationMs = useMemo(() => {
		const last = slideTimings[slideTimings.length - 1]
		if (!last) return 0
		return last.startTimeMs + last.durationMs
	}, [slideTimings])

	// Derive currentSlideIndex and currentStep from currentTimeMs
	const { currentSlideIndex, currentStep } = useMemo(() => {
		if (slideTimings.length === 0) return { currentSlideIndex: 0, currentStep: 0 }

		let slideIndex = 0
		for (let i = slideTimings.length - 1; i >= 0; i--) {
			const timing = slideTimings[i]
			if (timing && currentTimeMs >= timing.startTimeMs) {
				slideIndex = i
				break
			}
		}

		const timing = slideTimings[slideIndex]
		if (!timing) return { currentSlideIndex: 0, currentStep: 0 }

		let step = 0
		for (let s = timing.stepTimings.length - 1; s >= 0; s--) {
			const stepTime = timing.stepTimings[s]
			if (stepTime !== undefined && currentTimeMs >= stepTime) {
				step = s
				break
			}
		}

		return { currentSlideIndex: slideIndex, currentStep: step }
	}, [currentTimeMs, slideTimings])

	// RAF loop
	useEffect(() => {
		if (!isPlaying) {
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current)
				rafRef.current = null
			}
			return
		}

		lastFrameRef.current = performance.now()

		const tick = (now: number) => {
			const delta = now - lastFrameRef.current
			lastFrameRef.current = now

			setCurrentTimeMs((prev) => {
				const next = prev + delta
				if (next >= totalDurationMs) {
					setIsPlaying(false)
					return totalDurationMs
				}
				return next
			})

			rafRef.current = requestAnimationFrame(tick)
		}

		rafRef.current = requestAnimationFrame(tick)

		return () => {
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current)
				rafRef.current = null
			}
		}
	}, [isPlaying, totalDurationMs])

	const play = useCallback(() => {
		if (currentTimeMs >= totalDurationMs) {
			setCurrentTimeMs(0)
		}
		setIsPlaying(true)
	}, [currentTimeMs, totalDurationMs])

	const pause = useCallback(() => {
		setIsPlaying(false)
	}, [])

	const togglePlayPause = useCallback(() => {
		if (isPlaying) {
			pause()
		} else {
			play()
		}
	}, [isPlaying, play, pause])

	const seek = useCallback(
		(timeMs: number) => {
			setCurrentTimeMs(Math.max(0, Math.min(timeMs, totalDurationMs)))
		},
		[totalDurationMs],
	)

	const seekToSlide = useCallback(
		(slideIndex: number) => {
			const timing = slideTimings[slideIndex]
			if (timing) {
				setCurrentTimeMs(timing.startTimeMs)
			}
		},
		[slideTimings],
	)

	return {
		isPlaying,
		currentTimeMs,
		totalDurationMs,
		currentSlideIndex,
		currentStep,
		play,
		pause,
		togglePlayPause,
		seek,
		seekToSlide,
	}
}
