import path from "node:path"
import { parseCli } from "./cli"
import { loadVideoConfig } from "./config"
import { renderVideo } from "./render"

const cli = parseCli(process.argv.slice(2))
const config = loadVideoConfig(cli.configPath)

// Apply CLI overrides
if (cli.fpsOverride != null) {
	config.fps = cli.fpsOverride
}
if (cli.speed != null && config.voicevox) {
	config.voicevox.speed = cli.speed
}

const configPath = path.resolve(cli.configPath)
const configDir = path.dirname(configPath)
const outputPath = cli.output ?? cli.configPath.replace(/\.(slide|video)\.json$/, ".mp4")

await renderVideo(config, configDir, configPath, outputPath, {
	forceRegenerateAudio: cli.forceRegenerateAudio || cli.speed != null,
	scaleFactor: cli.scaleFactor,
	workers: cli.workers,
})
