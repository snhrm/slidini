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

const configDir = path.dirname(path.resolve(cli.configPath))
const outputPath = cli.output ?? cli.configPath.replace(/\.video\.json$/, ".mp4")

await renderVideo(config, configDir, outputPath)
