import { useEffect, useRef } from "react"
import { usePresentationStore } from "../store/presentation"
import { createMediaObjectUrls, fnv1aHash, readSlideJson, writeAutoSave } from "../utils/autoSave"
import { processDirectoryFiles } from "../utils/import"

const DEBOUNCE_MS = 2000
const POLL_INTERVAL_MS = 1500

export function useAutoSave(): void {
	const mediaHashesRef = useRef(new Map<string, string>())
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const savingRef = useRef(false)
	const pendingRef = useRef(false)
	const lastSavedHashRef = useRef<string | null>(null)
	const importingRef = useRef(false)

	useEffect(() => {
		const unsubscribe = usePresentationStore.subscribe((state, prevState) => {
			if (!state.autoSaveEnabled || !state.autoSaveDirHandle) return
			if (state.presentation === prevState.presentation) return
			if (importingRef.current) return

			const dirHandle = state.autoSaveDirHandle

			const doSave = async () => {
				if (savingRef.current) {
					pendingRef.current = true
					return
				}
				savingRef.current = true
				const { presentation, setAutoSaveStatus, disableAutoSave } = usePresentationStore.getState()
				setAutoSaveStatus("saving")
				try {
					const newHashes = await writeAutoSave(dirHandle, presentation, mediaHashesRef.current)
					mediaHashesRef.current = newHashes

					const title = presentation.meta.title || "presentation"
					const filename = `${title}.slide.json`
					const jsonHandle = await dirHandle.getFileHandle(filename)
					const file = await jsonHandle.getFile()
					const content = await file.text()
					lastSavedHashRef.current = fnv1aHash(content)

					setAutoSaveStatus("saved")
				} catch (e) {
					if (e instanceof DOMException && e.name === "NotAllowedError") {
						disableAutoSave()
						usePresentationStore.getState().setNotification("自動保存の権限が失われました")
					} else {
						setAutoSaveStatus("error", e instanceof Error ? e.message : "保存エラー")
					}
				} finally {
					savingRef.current = false
					if (pendingRef.current) {
						pendingRef.current = false
						doSave()
					}
				}
			}

			if (timerRef.current) {
				clearTimeout(timerRef.current)
			}
			timerRef.current = setTimeout(doSave, DEBOUNCE_MS)
		})

		const pollInterval = setInterval(async () => {
			const { autoSaveEnabled, autoSaveDirHandle } = usePresentationStore.getState()
			if (!autoSaveEnabled || !autoSaveDirHandle) return
			if (savingRef.current) return

			try {
				const slideJson = await readSlideJson(autoSaveDirHandle)
				if (!slideJson) return

				const currentHash = fnv1aHash(slideJson.content)
				if (lastSavedHashRef.current === null) {
					lastSavedHashRef.current = currentHash
					return
				}
				if (currentHash === lastSavedHashRef.current) return

				lastSavedHashRef.current = currentHash

				// Process with empty media map (keep filenames as-is)
				const result = processDirectoryFiles([slideJson], new Map())

				if (result.presentation) {
					importingRef.current = true
					const { currentSlideIndex, currentStep } = usePresentationStore.getState()
					const slideCount = result.presentation.slides.length
					const safeIndex = currentSlideIndex < slideCount ? currentSlideIndex : 0

					const updates: Record<string, unknown> = {
						presentation: result.presentation,
						currentSlideIndex: safeIndex,
						currentStep: safeIndex === currentSlideIndex ? currentStep : 0,
						selectedElementId: null,
					}
					if (result.playerConfig) {
						updates.presentation = { ...result.presentation, playback: result.playerConfig }
					}
					usePresentationStore.setState(updates)

					// Refresh Object URLs for media files
					const newMediaMap = await createMediaObjectUrls(autoSaveDirHandle)
					const { setMediaUrlMap } = usePresentationStore.getState()
					setMediaUrlMap(newMediaMap)

					setTimeout(() => {
						importingRef.current = false
					}, 100)
				}
			} catch {
				// polling errors are silently ignored
			}
		}, POLL_INTERVAL_MS)

		return () => {
			unsubscribe()
			clearInterval(pollInterval)
			if (timerRef.current) {
				clearTimeout(timerRef.current)
			}
		}
	}, [])
}
