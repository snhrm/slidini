import path from "node:path"
import { type ViteDevServer, createServer } from "vite"

const EXPORT_APP_DIR = path.resolve(import.meta.dirname, "../../export-app")

function getRandomPort(): number {
	return 10000 + Math.floor(Math.random() * 50000)
}

export async function startViteServer(): Promise<{ server: ViteDevServer; port: number }> {
	const server = await createServer({
		configFile: path.join(EXPORT_APP_DIR, "vite.config.ts"),
		server: {
			port: getRandomPort(),
			strictPort: false,
		},
		logLevel: "silent",
	})

	await server.listen()
	const address = server.httpServer?.address()
	if (!address || typeof address === "string") {
		throw new Error("Failed to get Vite server address")
	}

	const port = address.port
	console.log(`  Vite dev server started on port ${port}`)
	return { server, port }
}
