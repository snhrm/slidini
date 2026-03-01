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
	const { presentation, setCurrentSlideIndex, setCurrentStep } = usePresentationStore(
		useShallow((s) => ({
			presentation: s.presentation,
			setCurrentSlideIndex: s.setCurrentSlideIndex,
			setCurrentStep: s.setCurrentStep,
		})),
	)

	const effectiveConfig = useMemo(
		() => presentation.playback ?? createDefaultPlayerConfig(),
		[presentation.playback],
	)

	const engine = usePlaybackEngine(presentation, effectiveConfig)

	const audioTracks = useMemo(() => {
		const timings = computeSlideTimings(presentation, effectiveConfig)
		return resolveAudioTracks(effectiveConfig, timings)
	}, [presentation, effectiveConfig])

	useAudioPlayback(audioTracks, engine.currentTimeMs, engine.isPlaying)

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
