#!/usr/bin/env bun
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, isAbsolute, resolve } from "node:path"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { type Presentation, extractMediaFiles, parsePresentation } from "@slidini/core"
import { registerSlideTools } from "./slide-tools"
import { registerVideoTools } from "./video-tools"

// ===== Helpers =====

export function resolveProjectFile(filePath: string): string {
	return isAbsolute(filePath) ? filePath : resolve("projects", filePath)
}

export function readPresentation(filePath: string): Presentation {
	const absPath = resolveProjectFile(filePath)
	const raw = readFileSync(absPath, "utf-8")
	const data = JSON.parse(raw)
	const result = parsePresentation(data)
	if (!result.success) {
		throw new Error(
			`Invalid presentation file: ${result.error.issues.map((i) => i.message).join(", ")}`,
		)
	}
	return result.data
}

function dataUriToBuffer(dataUri: string): Buffer {
	const match = dataUri.match(/^data:[^;]+;base64,(.+)$/)
	if (!match?.[1]) throw new Error("Invalid data URI")
	return Buffer.from(match[1], "base64")
}

export function writePresentation(filePath: string, presentation: Presentation): void {
	const absPath = resolveProjectFile(filePath)
	mkdirSync(dirname(absPath), { recursive: true })
	presentation.meta.updatedAt = new Date().toISOString()

	const { cleanedPresentation, mediaFiles } = extractMediaFiles(presentation)
	writeFileSync(absPath, JSON.stringify(cleanedPresentation, null, 2), "utf-8")

	const dir = dirname(absPath)
	for (const { filename, dataUri } of mediaFiles) {
		writeFileSync(resolve(dir, filename), dataUriToBuffer(dataUri))
	}
}

export function findSlide(presentation: Presentation, slideId: string) {
	const slide = presentation.slides.find((s) => s.id === slideId)
	if (!slide) {
		throw new Error(
			`Slide not found: ${slideId}. Available: ${presentation.slides.map((s) => s.id).join(", ")}`,
		)
	}
	return slide
}

export function findSlideByIndex(presentation: Presentation, index: number) {
	const slide = presentation.slides[index]
	if (!slide) {
		throw new Error(
			`Slide index out of range: ${index}. Total slides: ${presentation.slides.length}`,
		)
	}
	return slide
}

export function ok(text: string) {
	return { content: [{ type: "text" as const, text }] }
}

export function err(text: string) {
	return { content: [{ type: "text" as const, text }], isError: true as const }
}

// ===== Server =====

const server = new McpServer({
	name: "slidini-mcp-server",
	version: "0.1.0",
})

registerSlideTools(server)
registerVideoTools(server)

// ===== Start Server =====

async function main() {
	const transport = new StdioServerTransport()
	await server.connect(transport)
	console.error("slidini MCP server running via stdio")
}

main().catch((error) => {
	console.error("Server error:", error)
	process.exit(1)
})
