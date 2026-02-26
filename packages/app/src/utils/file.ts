export function downloadJson(content: string, filename: string): void {
	const blob = new Blob([content], { type: "application/json" })
	const url = URL.createObjectURL(blob)
	const a = document.createElement("a")
	a.href = url
	a.download = filename
	a.click()
	URL.revokeObjectURL(url)
}

export function openJsonFile(): Promise<string> {
	return new Promise((resolve, reject) => {
		const input = document.createElement("input")
		input.type = "file"
		input.accept = ".json,.slide.json"
		input.onchange = () => {
			const file = input.files?.[0]
			input.remove()
			if (!file) {
				reject(new Error("No file selected"))
				return
			}
			const reader = new FileReader()
			reader.onload = () => resolve(reader.result as string)
			reader.onerror = () => reject(reader.error)
			reader.readAsText(file)
		}
		input.click()
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
