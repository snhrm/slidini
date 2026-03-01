import type { PlayerConfig, Presentation } from "@slidini/core"
import { parsePresentation } from "@slidini/core"

export type ImportResult = {
	presentation?: Presentation
	playerConfig?: PlayerConfig
	errors: string[]
}

function resolveMediaPath(path: string, mediaFiles: Map<string, string>): string {
	if (path.startsWith("data:")) return path
	const filename = path.split("/").pop() ?? path
	return mediaFiles.get(filename) ?? path
}

function resolvePlaybackMedia(
	playback: PlayerConfig,
	mediaFiles: Map<string, string>,
): PlayerConfig {
	return {
		...playback,
		slides: playback.slides.map((s) => ({
			...s,
			audioFile: s.audioFile ? resolveMediaPath(s.audioFile, mediaFiles) : undefined,
		})),
		bgm: playback.bgm.map((b) => ({
			...b,
			src: resolveMediaPath(b.src, mediaFiles),
		})),
	}
}

export function processDirectoryFiles(
	jsonFiles: { name: string; content: string }[],
	mediaFiles: Map<string, string>,
): ImportResult {
	const errors: string[] = []

	const slideFile = jsonFiles.find((f) => f.name.endsWith(".slide.json"))
	if (!slideFile) {
		return { errors: ["フォルダ内に .slide.json が見つかりません"] }
	}

	let presentation: Presentation | undefined
	let playerConfig: PlayerConfig | undefined

	try {
		const data = JSON.parse(slideFile.content)
		const result = parsePresentation(data)
		if (result.success) {
			presentation = result.data
			if (result.data.playback) {
				playerConfig = resolvePlaybackMedia(result.data.playback, mediaFiles)
			}
		} else {
			errors.push(`${slideFile.name}: JSONの形式が正しくありません`)
		}
	} catch {
		errors.push(`${slideFile.name}: JSONパースエラー`)
	}

	return { presentation, playerConfig, errors }
}
