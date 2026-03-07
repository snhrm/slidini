import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { extname, join, resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import type { Plugin } from "vite"
import { defineConfig } from "vite"

function serveProjectsPlugin(): Plugin {
	const projectsDir = resolve(__dirname, "../../projects")

	const mimeMap: Record<string, string> = {
		".json": "application/json",
		".wav": "audio/wav",
		".mp3": "audio/mpeg",
		".ogg": "audio/ogg",
		".m4a": "audio/mp4",
		".webm": "audio/webm",
		".flac": "audio/flac",
	}

	return {
		name: "serve-projects",
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				const urlPath = req.url?.split("?")[0]
				if (!urlPath?.startsWith("/projects/")) return next()

				const relPath = decodeURIComponent(urlPath.slice("/projects/".length))
				const filePath = join(projectsDir, relPath)
				if (!filePath.startsWith(projectsDir)) return next()

				// .slide.json が存在しなければデフォルトを生成（HEAD リクエストではスキップ）
				if (filePath.endsWith(".slide.json") && req.method !== "HEAD") {
					try {
						statSync(filePath)
					} catch {
						const match = relPath.match(/^([^/]+)\/\1\.slide\.json$/)
						if (match) {
							const dirPath = join(projectsDir, match[1])
							mkdirSync(dirPath, { recursive: true })
							const now = new Date().toISOString()
							const defaultPres = {
								meta: {
									schemaVersion: 1,
									title: match[1],
									width: 1920,
									height: 1080,
									createdAt: now,
									updatedAt: now,
								},
								slides: [
									{
										id: `slide_${Date.now()}`,
										background: { type: "color", value: "#0f172a" },
										transition: { type: "fade", duration: 0.5, easing: "ease-out" },
										elements: [
											{
												id: `text_${Date.now()}`,
												type: "text",
												content: `# ${match[1]}`,
												position: { x: 160, y: 340 },
												size: { width: 1600, height: 400 },
												rotation: 0,
												opacity: 1,
												zIndex: 1,
												style: {
													fontSize: 48,
													color: "#f8fafc",
													textAlign: "center",
													fontWeight: "normal",
												},
												animations: [],
											},
										],
									},
								],
							}
							writeFileSync(filePath, JSON.stringify(defaultPres, null, 2))
						}
					}
				}

				try {
					const s = statSync(filePath)
					if (!s.isFile()) return next()
					const content = readFileSync(filePath)
					res.setHeader("Content-Type", mimeMap[extname(filePath)] ?? "application/octet-stream")
					res.setHeader("Content-Length", s.size)
					res.end(content)
				} catch {
					next()
				}
			})
		},
	}
}

export default defineConfig({
	plugins: [react(), tailwindcss(), serveProjectsPlugin()],
})
