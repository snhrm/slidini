import type { PlayerConfig, Presentation as PresentationType, SlideElement } from "@slidini/core"
import { Presentation } from "@slidini/renderer"
import { useCallback, useEffect } from "react"
import type { AudioTrack } from "../hooks/useAudioPlayback"
import { useAudioPlayback } from "../hooks/useAudioPlayback"
import { usePlaybackEngine } from "../hooks/usePlaybackEngine"
import { PlayerControls } from "./PlayerControls"

export type VideoPlayerProps = {
	data: PresentationType
	playerConfig?: PlayerConfig
	mode?: "edit" | "view"
	selectedElementId?: string | null
	onElementSelect?: (id: string | null) => void
	onElementUpdate?: (
		elementId: string,
		updates: Partial<Pick<SlideElement, "position" | "size">>,
	) => void
	audioTracks?: AudioTrack[]
}

export function VideoPlayer({
	data,
	playerConfig,
	mode = "view",
	selectedElementId,
	onElementSelect,
	onElementUpdate,
	audioTracks = [],
}: VideoPlayerProps) {
	const {
		isPlaying,
		currentTimeMs,
		totalDurationMs,
		currentSlideIndex,
		currentStep,
		play,
		pause,
		togglePlayPause,
		seek,
	} = usePlaybackEngine(data, playerConfig)

	useAudioPlayback(audioTracks, currentTimeMs, isPlaying)

	// Pause on element select in edit mode
	const handleElementSelect = useCallback(
		(id: string | null) => {
			if (mode === "edit" && id !== null) {
				pause()
			}
			onElementSelect?.(id)
		},
		[mode, pause, onElementSelect],
	)

	// Space key → play/pause
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				e.key === " " &&
				!e.metaKey &&
				!e.ctrlKey &&
				!(e.target instanceof HTMLInputElement) &&
				!(e.target instanceof HTMLTextAreaElement) &&
				!(e.target instanceof HTMLSelectElement)
			) {
				e.preventDefault()
				togglePlayPause()
			}
		}
		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [togglePlayPause])

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
			}}
		>
			<div style={{ flex: 1, minHeight: 0 }}>
				<Presentation
					data={data}
					currentSlide={currentSlideIndex}
					currentStep={currentStep}
					viewMode="single"
					mode={mode}
					selectedElementId={selectedElementId}
					onElementSelect={handleElementSelect}
					onElementUpdate={onElementUpdate}
				/>
			</div>
			<PlayerControls
				isPlaying={isPlaying}
				currentTimeMs={currentTimeMs}
				totalDurationMs={totalDurationMs}
				currentSlideIndex={currentSlideIndex}
				totalSlides={data.slides.length}
				onTogglePlayPause={togglePlayPause}
				onSeek={seek}
			/>
		</div>
	)
}
