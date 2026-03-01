import type { PlayerConfig, SlideTiming } from "@slidini/core"
import type { AudioTrack } from "@slidini/player"

export function resolveAudioTracks(
	playerConfig: PlayerConfig,
	slideTimings: SlideTiming[],
): AudioTrack[] {
	const tracks: AudioTrack[] = []

	// Narration audio tracks
	for (const slideConfig of playerConfig.slides) {
		if (!slideConfig.audioFile) continue
		const timing = slideTimings[slideConfig.slideIndex]
		if (!timing) continue

		tracks.push({
			id: `narration-${slideConfig.slideIndex}`,
			src: slideConfig.audioFile,
			startTimeMs: timing.startTimeMs,
			durationMs: timing.durationMs,
			volume: 1,
			loop: false,
			fadeInMs: 0,
			fadeOutMs: 0,
		})
	}

	// BGM tracks
	const totalDuration =
		slideTimings.length > 0
			? (() => {
					const last = slideTimings[slideTimings.length - 1]
					return last ? last.startTimeMs + last.durationMs : 0
				})()
			: 0

	for (let i = 0; i < playerConfig.bgm.length; i++) {
		const bgm = playerConfig.bgm[i]
		if (!bgm) continue

		let startTimeMs = 0
		let endTimeMs = totalDuration

		if (bgm.fromSlide !== undefined) {
			const timing = slideTimings[bgm.fromSlide]
			if (timing) startTimeMs = timing.startTimeMs
		}
		if (bgm.toSlide !== undefined) {
			const timing = slideTimings[bgm.toSlide]
			if (timing) endTimeMs = timing.startTimeMs + timing.durationMs
		}

		tracks.push({
			id: `bgm-${i}`,
			src: bgm.src,
			startTimeMs,
			durationMs: endTimeMs - startTimeMs,
			volume: bgm.volume,
			loop: bgm.loop,
			fadeInMs: bgm.fadeIn * 1000,
			fadeOutMs: bgm.fadeOut * 1000,
		})
	}

	return tracks
}
