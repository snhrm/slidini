import { useEffect } from "react"
import { usePresentationStore } from "../store/presentation"
import { fetchProject } from "../utils/fetchProject"
import { parseProjectHash } from "../utils/hashRoute"

export function useHashRoute(): void {
	useEffect(() => {
		const loadProject = async (projectName: string) => {
			if (usePresentationStore.getState().hashProjectName === projectName) return

			const store = usePresentationStore.getState()
			store.setHashLoadStatus("loading")
			store.disableAutoSave()

			try {
				const { presentation, playerConfig, mediaUrlMap } = await fetchProject(projectName)

				const { importData, setMediaUrlMap, setHashLoadStatus, setHashProjectName } =
					usePresentationStore.getState()
				importData({ presentation, playerConfig })
				setMediaUrlMap(mediaUrlMap)
				setHashProjectName(projectName)
				setHashLoadStatus("loaded")
			} catch (e) {
				const msg = e instanceof Error ? e.message : "読み込みエラー"
				usePresentationStore.getState().setHashLoadStatus("error", msg)
			}
		}

		const handleHash = () => {
			const projectName = parseProjectHash(window.location.hash)
			if (projectName) {
				loadProject(projectName)
			}
		}

		handleHash()

		window.addEventListener("hashchange", handleHash)
		return () => window.removeEventListener("hashchange", handleHash)
	}, [])
}
