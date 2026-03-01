import { useEffect, useRef } from "react"
import { usePresentationStore } from "../store/presentation"
import { writeAutoSave } from "../utils/autoSave"

const DEBOUNCE_MS = 2000

export function useAutoSave(): void {
	const mediaHashesRef = useRef(new Map<string, string>())
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const savingRef = useRef(false)
	const pendingRef = useRef(false)

	useEffect(() => {
		const unsubscribe = usePresentationStore.subscribe((state, prevState) => {
			if (!state.autoSaveEnabled || !state.autoSaveDirHandle) return
			if (state.presentation === prevState.presentation) return

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

		return () => {
			unsubscribe()
			if (timerRef.current) {
				clearTimeout(timerRef.current)
			}
		}
	}, [])
}
