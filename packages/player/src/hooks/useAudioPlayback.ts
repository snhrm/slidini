import { useEffect, useRef } from "react"

export type AudioTrack = {
	id: string
	src: string
	startTimeMs: number // global timeline position
	durationMs: number
	volume: number // 0-1
	loop: boolean
	fadeInMs: number
	fadeOutMs: number
}

export function useAudioPlayback(
	tracks: AudioTrack[],
	currentTimeMs: number,
	isPlaying: boolean,
): void {
	const audioMapRef = useRef<Map<string, HTMLAudioElement>>(new Map())
	const tracksRef = useRef(tracks)
	tracksRef.current = tracks

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			for (const audio of audioMapRef.current.values()) {
				audio.pause()
				audio.src = ""
			}
			audioMapRef.current.clear()
		}
	}, [])

	// Sync audio with playback state
	useEffect(() => {
		const audioMap = audioMapRef.current
		const currentTracks = tracksRef.current

		for (const track of currentTracks) {
			const endTimeMs = track.startTimeMs + track.durationMs
			const isInRange = currentTimeMs >= track.startTimeMs && currentTimeMs < endTimeMs

			if (isInRange && isPlaying) {
				let audio = audioMap.get(track.id)
				if (!audio) {
					audio = new Audio(track.src)
					audio.loop = track.loop
					audioMap.set(track.id, audio)
				}

				// Sync audio.currentTime
				const expectedTime = (currentTimeMs - track.startTimeMs) / 1000
				if (Math.abs(audio.currentTime - expectedTime) > 0.3) {
					audio.currentTime = expectedTime
				}

				// Compute volume with fade
				let volume = track.volume
				const elapsed = currentTimeMs - track.startTimeMs
				const remaining = endTimeMs - currentTimeMs

				if (track.fadeInMs > 0 && elapsed < track.fadeInMs) {
					volume *= elapsed / track.fadeInMs
				}
				if (track.fadeOutMs > 0 && remaining < track.fadeOutMs) {
					volume *= remaining / track.fadeOutMs
				}

				audio.volume = Math.max(0, Math.min(1, volume))

				if (audio.paused) {
					audio.play().catch(() => {
						// autoplay might be blocked
					})
				}
			} else {
				const audio = audioMap.get(track.id)
				if (audio && !audio.paused) {
					audio.pause()
				}
				if (!isInRange) {
					const audio = audioMap.get(track.id)
					if (audio) {
						audio.pause()
						audio.src = ""
						audioMap.delete(track.id)
					}
				}
			}
		}

		// Remove tracks that are no longer in the list
		for (const [id, audio] of audioMap.entries()) {
			if (!currentTracks.some((t) => t.id === id)) {
				audio.pause()
				audio.src = ""
				audioMap.delete(id)
			}
		}
	}, [currentTimeMs, isPlaying])
}
