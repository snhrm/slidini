import type { Presentation } from "./types"

export type MediaFile = {
	filename: string
	dataUri: string
}

const MIME_TO_EXT: Record<string, string> = {
	"audio/wav": ".wav",
	"audio/x-wav": ".wav",
	"audio/mpeg": ".mp3",
	"audio/ogg": ".ogg",
	"audio/mp4": ".m4a",
	"audio/aac": ".aac",
	"audio/flac": ".flac",
	"audio/webm": ".webm",
}

function extensionFromDataUri(dataUri: string): string {
	const mime = dataUri.match(/^data:([^;,]+)/)?.[1]
	if (!mime) return ".bin"
	return MIME_TO_EXT[mime] ?? ".bin"
}

/**
 * Extract embedded data URI media from a presentation, replacing them with relative filenames.
 * Returns a new presentation (original is not mutated) and a list of media files to save.
 */
export function extractMediaFiles(presentation: Presentation): {
	cleanedPresentation: Presentation
	mediaFiles: MediaFile[]
} {
	const mediaFiles: MediaFile[] = []

	if (!presentation.playback) {
		return { cleanedPresentation: presentation, mediaFiles }
	}

	const playback = { ...presentation.playback }

	playback.bgm = playback.bgm.map((bgm, index) => {
		if (!bgm.src.startsWith("data:")) return bgm
		const ext = extensionFromDataUri(bgm.src)
		const filename = `bgm-${index}${ext}`
		mediaFiles.push({ filename, dataUri: bgm.src })
		return { ...bgm, src: filename }
	})

	playback.slides = playback.slides.map((slide) => {
		if (!slide.audioFile?.startsWith("data:")) return slide
		const ext = extensionFromDataUri(slide.audioFile)
		const filename = `narration-${String(slide.slideIndex).padStart(3, "0")}${ext}`
		mediaFiles.push({ filename, dataUri: slide.audioFile })
		return { ...slide, audioFile: filename }
	})

	return {
		cleanedPresentation: { ...presentation, playback },
		mediaFiles,
	}
}
