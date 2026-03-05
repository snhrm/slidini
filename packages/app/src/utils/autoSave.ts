import { extractMediaFiles } from "@slidini/core"
import type { Presentation } from "@slidini/core"
import { dataUriToBlob } from "./file"

const AUDIO_EXTENSIONS = [".wav", ".mp3", ".ogg", ".m4a", ".aac", ".flac", ".webm"]

function isAudioFile(name: string): boolean {
	const lower = name.toLowerCase()
	return AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

export function fnv1aHash(str: string): string {
	let hash = 0x811c9dc5
	for (let i = 0; i < str.length; i++) {
		hash ^= str.charCodeAt(i)
		hash = Math.imul(hash, 0x01000193)
	}
	return (hash >>> 0).toString(36)
}

export async function writeAutoSave(
	dirHandle: FileSystemDirectoryHandle,
	presentation: Presentation,
	previousMediaHashes: Map<string, string>,
): Promise<Map<string, string>> {
	const title = presentation.meta.title || "presentation"
	const filename = `${title}.slide.json`
	const { cleanedPresentation, mediaFiles } = extractMediaFiles(presentation)

	const jsonContent = JSON.stringify(cleanedPresentation, null, 2)
	const jsonHandle = await dirHandle.getFileHandle(filename, { create: true })
	const jsonWritable = await jsonHandle.createWritable()
	await jsonWritable.write(jsonContent)
	await jsonWritable.close()

	const newHashes = new Map<string, string>()

	for (const { filename: mediaFilename, dataUri } of mediaFiles) {
		const hash = fnv1aHash(dataUri)
		newHashes.set(mediaFilename, hash)

		if (previousMediaHashes.get(mediaFilename) === hash) {
			continue
		}

		const blob = dataUriToBlob(dataUri)
		const fileHandle = await dirHandle.getFileHandle(mediaFilename, { create: true })
		const writable = await fileHandle.createWritable()
		await writable.write(blob)
		await writable.close()
	}

	return newHashes
}

export async function readSlideJson(
	dirHandle: FileSystemDirectoryHandle,
): Promise<{ name: string; content: string } | null> {
	for await (const entry of dirHandle.values()) {
		if (entry.kind === "file" && entry.name.endsWith(".slide.json")) {
			const fileHandle = entry as FileSystemFileHandle
			const file = await fileHandle.getFile()
			const content = await file.text()
			return { name: entry.name, content }
		}
	}
	return null
}

function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => resolve(reader.result as string)
		reader.onerror = () => reject(reader.error)
		reader.readAsDataURL(file)
	})
}

export async function readMediaFilesFromDir(
	dirHandle: FileSystemDirectoryHandle,
): Promise<Map<string, string>> {
	const mediaFiles = new Map<string, string>()
	for await (const entry of dirHandle.values()) {
		if (entry.kind === "file" && isAudioFile(entry.name)) {
			const fileHandle = entry as FileSystemFileHandle
			const file = await fileHandle.getFile()
			const dataUri = await fileToBase64(file)
			mediaFiles.set(entry.name, dataUri)
		}
	}
	return mediaFiles
}

export async function createMediaObjectUrls(
	dirHandle: FileSystemDirectoryHandle,
): Promise<Map<string, string>> {
	const map = new Map<string, string>()
	for await (const entry of dirHandle.values()) {
		if (entry.kind === "file" && isAudioFile(entry.name)) {
			const fileHandle = entry as FileSystemFileHandle
			const file = await fileHandle.getFile()
			map.set(entry.name, URL.createObjectURL(file))
		}
	}
	return map
}
