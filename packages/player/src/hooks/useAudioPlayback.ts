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
	// Track the original src used to create each audio element
	const srcMapRef = useRef<Map<string, string>>(new Map())
	// Track pending play() promises to avoid calling play() repeatedly
	const pendingPlaysRef = useRef<Set<string>>(new Set())

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			for (const audio of audioMapRef.current.values()) {
				audio.pause()
				audio.src = ""
			}
			audioMapRef.current.clear()
			srcMapRef.current.clear()
			pendingPlaysRef.current.clear()
		}
	}, [])

	// Sync audio with playback state
	useEffect(() => {
		const audioMap = audioMapRef.current
		const srcMap = srcMapRef.current
		const currentTracks = tracksRef.current
		const pendingPlays = pendingPlaysRef.current

		for (const track of currentTracks) {
			// Skip tracks with no audio source
			if (!track.src) continue

			const endTimeMs = track.startTimeMs + track.durationMs
			const isInRange = currentTimeMs >= track.startTimeMs && currentTimeMs < endTimeMs

			if (isInRange && isPlaying) {
				let audio = audioMap.get(track.id)

				// Replace audio if the source has changed
				if (audio && srcMap.get(track.id) !== track.src) {
					audio.pause()
					audio.src = ""
					audioMap.delete(track.id)
					srcMap.delete(track.id)
					pendingPlays.delete(track.id)
					audio = undefined
				}

				if (!audio) {
					audio = new Audio(track.src)
					audio.loop = track.loop
					audioMap.set(track.id, audio)
					srcMap.set(track.id, track.src)
				}

				// Sync audio.currentTime
				let expectedTime = (currentTimeMs - track.startTimeMs) / 1000
				if (track.loop && audio.duration && Number.isFinite(audio.duration)) {
					expectedTime = expectedTime % audio.duration
				}
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

				// Only call play() if not already playing and no pending play request
				if (audio.paused && !pendingPlays.has(track.id)) {
					pendingPlays.add(track.id)
					audio
						.play()
						.then(() => {
							pendingPlays.delete(track.id)
						})
						.catch(() => {
							pendingPlays.delete(track.id)
						})
				}
			} else {
				const audio = audioMap.get(track.id)
				if (audio && !audio.paused) {
					audio.pause()
				}
				pendingPlays.delete(track.id)
				// Only destroy audio elements when playback is stopped
				// to avoid cleanup/recreation churn during active playback
				if (!isInRange && !isPlaying) {
					const audio = audioMap.get(track.id)
					if (audio) {
						audio.pause()
						audio.src = ""
						audioMap.delete(track.id)
						srcMap.delete(track.id)
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
				srcMap.delete(id)
				pendingPlays.delete(id)
			}
		}
	}, [currentTimeMs, isPlaying])
}
