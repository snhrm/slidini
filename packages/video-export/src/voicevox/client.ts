export type VoicevoxClient = {
	synthesize(text: string, speaker: number, speed: number): Promise<Buffer>
	isAvailable(): Promise<boolean>
}

export function createVoicevoxClient(baseUrl: string): VoicevoxClient {
	async function isAvailable(): Promise<boolean> {
		try {
			const res = await fetch(`${baseUrl}/version`)
			return res.ok
		} catch {
			return false
		}
	}

	async function synthesize(text: string, speaker: number, speed: number): Promise<Buffer> {
		// Step 1: Create audio query
		const queryRes = await fetch(
			`${baseUrl}/audio_query?text=${encodeURIComponent(text)}&speaker=${speaker}`,
			{ method: "POST" },
		)
		if (!queryRes.ok) {
			throw new Error(`VOICEVOX audio_query failed: ${queryRes.status} ${queryRes.statusText}`)
		}
		const audioQuery = await queryRes.json()
		audioQuery.speedScale = speed

		// Step 2: Synthesize audio
		const synthRes = await fetch(`${baseUrl}/synthesis?speaker=${speaker}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(audioQuery),
		})
		if (!synthRes.ok) {
			throw new Error(`VOICEVOX synthesis failed: ${synthRes.status} ${synthRes.statusText}`)
		}

		const arrayBuffer = await synthRes.arrayBuffer()
		return Buffer.from(arrayBuffer)
	}

	return { synthesize, isAvailable }
}

/** Parse WAV buffer to get duration in milliseconds */
export function getWavDurationMs(wavBuffer: Buffer): number {
	// WAV header: bytes 24-27 = sample rate (uint32 LE), bytes 28-31 = byte rate (uint32 LE)
	// Data chunk starts after header; total audio bytes / byte rate = duration in seconds
	const byteRate = wavBuffer.readUInt32LE(28)
	if (byteRate === 0) return 0

	// Find "data" chunk
	let offset = 12 // skip RIFF header
	while (offset < wavBuffer.length - 8) {
		const chunkId = wavBuffer.toString("ascii", offset, offset + 4)
		const chunkSize = wavBuffer.readUInt32LE(offset + 4)
		if (chunkId === "data") {
			return (chunkSize / byteRate) * 1000
		}
		offset += 8 + chunkSize
	}

	// Fallback: estimate from total file size
	return ((wavBuffer.length - 44) / byteRate) * 1000
}
