import { createDefaultPlayerConfig } from "@slidini/core"
import {
	PlayerControls,
	computeSlideTimings,
	useAudioPlayback,
	usePlaybackEngine,
} from "@slidini/player"
import { useCallback, useEffect, useMemo } from "react"
import { useShallow } from "zustand/react/shallow"
import { usePresentationStore } from "../store/presentation"
import { resolveAudioTracks } from "../utils/audio"

export function PlaybackBar() {
	const {
		presentation,
		mediaUrlMap,
		setCurrentSlideIndex,
		setCurrentStep,
		setPlaybackSeekToSlide,
	} = usePresentationStore(
		useShallow((s) => ({
			presentation: s.presentation,
			mediaUrlMap: s.mediaUrlMap,
			setCurrentSlideIndex: s.setCurrentSlideIndex,
			setCurrentStep: s.setCurrentStep,
			setPlaybackSeekToSlide: s.setPlaybackSeekToSlide,
		})),
	)

	const effectiveConfig = useMemo(
		() => presentation.playback ?? createDefaultPlayerConfig(),
		[presentation.playback],
	)

	const engine = usePlaybackEngine(presentation, effectiveConfig)

	const audioTracks = useMemo(() => {
		const timings = computeSlideTimings(presentation, effectiveConfig)
		return resolveAudioTracks(effectiveConfig, timings, mediaUrlMap)
	}, [presentation, effectiveConfig, mediaUrlMap])

	useAudioPlayback(audioTracks, engine.currentTimeMs, engine.isPlaying)

	// Register seekToSlide so SlideList can call it during playback
	useEffect(() => {
		setPlaybackSeekToSlide((slideIndex: number) => {
			engine.seekToSlide(slideIndex)
		})
		return () => setPlaybackSeekToSlide(null)
	}, [engine.seekToSlide, setPlaybackSeekToSlide])

	// Wrap togglePlayPause to unlock audio autoplay in user gesture context
	const handleTogglePlayPause = useCallback(() => {
		if (!engine.isPlaying) {
			try {
				const ctx = new AudioContext()
				ctx
					.resume()
					.then(() => ctx.close())
					.catch(() => {})
			} catch {
				// AudioContext not available
			}
		}
		engine.togglePlayPause()
	}, [engine.isPlaying, engine.togglePlayPause])

	// Sync engine → store: update store when engine advances
	useEffect(() => {
		if (engine.isPlaying) {
			setCurrentSlideIndex(engine.currentSlideIndex)
			setCurrentStep(engine.currentStep)
		}
	}, [
		engine.isPlaying,
		engine.currentSlideIndex,
		engine.currentStep,
		setCurrentSlideIndex,
		setCurrentStep,
	])

	return (
		<PlayerControls
			isPlaying={engine.isPlaying}
			currentTimeMs={engine.currentTimeMs}
			totalDurationMs={engine.totalDurationMs}
			currentSlideIndex={engine.currentSlideIndex}
			totalSlides={presentation.slides.length}
			onTogglePlayPause={handleTogglePlayPause}
			onSeek={engine.seek}
		/>
	)
}
