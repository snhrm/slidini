export function parseProjectHash(hash: string): string | null {
	const match = hash.match(/^#\/projects\/([^/]+)$/)
	return match?.[1] ? decodeURIComponent(match[1]) : null
}
