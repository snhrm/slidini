import fs from "node:fs"
import path from "node:path"
import puppeteer, { type Browser, type Page } from "puppeteer"

const TIMEWEB_PATH = path.resolve(import.meta.dirname, "../../node_modules/timeweb/dist/timeweb.js")

export type ExportBrowser = {
	page: Page
	browser: Browser
	close(): Promise<void>
}

export async function launchBrowser(
	port: number,
	exportConfig: unknown,
	width: number,
	height: number,
): Promise<ExportBrowser> {
	const browser = await puppeteer.launch({
		headless: true,
		args: [
			`--window-size=${width},${height}`,
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--disable-gpu",
			"--font-render-hinting=none",
		],
	})

	const page = await browser.newPage()
	await page.setViewport({ width, height, deviceScaleFactor: 1 })

	// Inject timeweb to virtualize all time APIs
	const timewebScript = fs.readFileSync(TIMEWEB_PATH, "utf-8")
	await page.evaluateOnNewDocument(timewebScript)

	// Disable Web Animations API (WAAPI) to force JS-based animation fallback.
	// Framer Motion v11+ uses WAAPI for opacity and transform animations.
	// WAAPI runs on real browser time, ignoring timeweb's virtual time, which
	// causes animations to desync from the frame-by-frame capture pipeline.
	// By removing Element.animate, Framer Motion falls back to JS-driven
	// animation via requestAnimationFrame + performance.now(), both of which
	// are virtualized by timeweb.
	await page.evaluateOnNewDocument(() => {
		// biome-ignore lint/performance/noDelete: need to remove WAAPI for timeweb compat
		delete (Element.prototype as Partial<Element>).animate
	})

	// Inject export configuration (before page load so React can read it)
	await page.evaluateOnNewDocument((config: unknown) => {
		;(window as unknown as Record<string, unknown>).__EXPORT_CONFIG__ = config
	}, exportConfig)

	// Capture browser console for debugging
	page.on("console", (msg) => {
		const type = msg.type()
		if (type === "error" || type === "warn") {
			console.log(`  [browser:${type}] ${msg.text()}`)
		}
	})
	page.on("pageerror", (err) => {
		console.log(`  [browser:pageerror] ${String(err)}`)
	})

	// Navigate and wait for React to mount and fonts to load
	await page.goto(`http://localhost:${port}`, { waitUntil: "networkidle0" })
	await page.waitForFunction(
		() => (window as unknown as Record<string, unknown>).__EXPORT_READY__ === true,
		{ timeout: 30000 },
	)

	console.log("  Browser ready, fonts loaded")

	return {
		page,
		browser,
		async close() {
			await browser.close()
		},
	}
}
