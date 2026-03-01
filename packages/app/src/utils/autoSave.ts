import { extractMediaFiles } from "@slidini/core"
import type { Presentation } from "@slidini/core"
import { dataUriToBlob } from "./file"

function fnv1aHash(str: string): string {
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
