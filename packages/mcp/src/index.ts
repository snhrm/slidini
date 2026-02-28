#!/usr/bin/env bun
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, isAbsolute, resolve } from "node:path"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { type Presentation, parsePresentation } from "@slidini/core"
import { registerSlideTools } from "./slide-tools"
import { registerVideoTools } from "./video-tools"

// ===== Helpers =====

export function resolveSlideFile(filePath: string): string {
	return isAbsolute(filePath) ? filePath : resolve("slide", filePath)
}

export function resolveVideoFile(filePath: string): string {
	return isAbsolute(filePath) ? filePath : resolve("video", filePath)
}

export function readPresentation(filePath: string): Presentation {
	const absPath = resolveSlideFile(filePath)
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

export function writePresentation(filePath: string, presentation: Presentation): void {
	const absPath = resolveSlideFile(filePath)
	mkdirSync(dirname(absPath), { recursive: true })
	presentation.meta.updatedAt = new Date().toISOString()
	writeFileSync(absPath, JSON.stringify(presentation, null, 2), "utf-8")
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
