export function dataUriToBlob(dataUri: string): Blob {
	const [header, base64] = dataUri.split(",")
	const mime = header?.match(/data:([^;]+)/)?.[1] ?? "application/octet-stream"
	const binary = atob(base64 ?? "")
	const bytes = new Uint8Array(binary.length)
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i)
	}
	return new Blob([bytes], { type: mime })
}

export async function saveToDirectory(
	jsonContent: string,
	jsonFilename: string,
	mediaFiles: { filename: string; dataUri: string }[],
): Promise<void> {
	const dirHandle = await (
		window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }
	).showDirectoryPicker()

	const jsonHandle = await dirHandle.getFileHandle(jsonFilename, { create: true })
	const jsonWritable = await jsonHandle.createWritable()
	await jsonWritable.write(jsonContent)
	await jsonWritable.close()

	for (const { filename, dataUri } of mediaFiles) {
		const blob = dataUriToBlob(dataUri)
		const fileHandle = await dirHandle.getFileHandle(filename, { create: true })
		const writable = await fileHandle.createWritable()
		await writable.write(blob)
		await writable.close()
	}
}

export function downloadJson(content: string, filename: string): void {
	const blob = new Blob([content], { type: "application/json" })
	const url = URL.createObjectURL(blob)
	const a = document.createElement("a")
	a.href = url
	a.download = filename
	a.click()
	URL.revokeObjectURL(url)
}

export type DirectoryResult = {
	jsonFiles: { name: string; content: string }[]
	mediaFiles: Map<string, string> // filename -> data URI
}

const AUDIO_EXTENSIONS = [".wav", ".mp3", ".ogg", ".m4a", ".aac", ".flac", ".webm"]

function isAudioFile(name: string): boolean {
	const lower = name.toLowerCase()
	return AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

export function openDirectory(): Promise<DirectoryResult> {
	return new Promise((resolve, reject) => {
		const input = document.createElement("input")
		input.type = "file"
		input.webkitdirectory = true
		input.onchange = async () => {
			const files = input.files
			input.remove()
			if (!files || files.length === 0) {
				reject(new Error("No directory selected"))
				return
			}
			const jsonFiles: DirectoryResult["jsonFiles"] = []
			const mediaFiles = new Map<string, string>()
			const fileArray = Array.from(files)

			for (const file of fileArray) {
				if (file.name.endsWith(".json")) {
					try {
						const content = await readFileAsText(file)
						jsonFiles.push({ name: file.name, content })
					} catch {
						// skip
					}
				} else if (isAudioFile(file.name)) {
					try {
						const dataUri = await fileToBase64(file)
						mediaFiles.set(file.name, dataUri)
					} catch {
						// skip
					}
				}
			}
			resolve({ jsonFiles, mediaFiles })
		}
		input.click()
	})
}

function readFileAsText(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => resolve(reader.result as string)
		reader.onerror = () => reject(reader.error)
		reader.readAsText(file)
	})
}

function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => resolve(reader.result as string)
		reader.onerror = () => reject(reader.error)
		reader.readAsDataURL(file)
	})
}

const MAX_FILE_SIZE_MB = 50
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024

function openMediaFile(accept: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const input = document.createElement("input")
		input.type = "file"
		input.accept = accept
		input.onchange = async () => {
			const file = input.files?.[0]
			input.remove()
			if (!file) {
				reject(new Error("No file selected"))
				return
			}
			if (file.size > MAX_FILE_SIZE) {
				reject(new Error(`ファイルサイズが${MAX_FILE_SIZE_MB}MBを超えています`))
				return
			}
			try {
				const base64 = await fileToBase64(file)
				resolve(base64)
			} catch (e) {
				reject(e)
			}
		}
		input.click()
	})
}

export function openImageFile(): Promise<string> {
	return openMediaFile("image/*")
}

export function openVideoFile(): Promise<string> {
	return openMediaFile("video/*")
}
