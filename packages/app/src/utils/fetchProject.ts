import type { PlayerConfig, Presentation } from "@slidini/core"
import { parsePresentation } from "@slidini/core"

export type FetchProjectResult = {
	presentation: Presentation
	playerConfig?: PlayerConfig
	mediaUrlMap: Map<string, string>
}

function buildMediaUrlMap(
	projectName: string,
	playback: PlayerConfig | undefined,
): Map<string, string> {
	const map = new Map<string, string>()
	if (!playback) return map

	const basePath = `/projects/${projectName}/`

	for (const slide of playback.slides) {
		if (slide.audioFile && !slide.audioFile.startsWith("data:")) {
			const relPath = slide.audioFile.replace(/^\.\//, "")
			const filename = relPath.split("/").pop() ?? relPath
			map.set(filename, `${basePath}${relPath}`)
		}
	}
	for (const bgm of playback.bgm) {
		if (!bgm.src.startsWith("data:")) {
			const relPath = bgm.src.replace(/^\.\//, "")
			const filename = relPath.split("/").pop() ?? relPath
			map.set(filename, `${basePath}${relPath}`)
		}
	}

	return map
}

export async function fetchProject(projectName: string): Promise<FetchProjectResult> {
	const url = `/projects/${projectName}/${projectName}.slide.json`
	const res = await fetch(url)
	if (!res.ok) {
		throw new Error(`プロジェクトの読み込みに失敗しました: ${res.status}`)
	}

	const data = await res.json()
	const result = parsePresentation(data)
	if (!result.success) {
		throw new Error("プロジェクトのJSONが不正です")
	}

	const presentation = result.data
	const playerConfig = presentation.playback ?? undefined
	const mediaUrlMap = buildMediaUrlMap(projectName, playerConfig)

	return { presentation, playerConfig, mediaUrlMap }
}
