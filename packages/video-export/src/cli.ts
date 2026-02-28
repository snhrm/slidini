import { parseArgs } from "node:util"

export type CliOptions = {
	configPath: string
	output: string | null
	fpsOverride: number | null
}

export function parseCli(args: string[]): CliOptions {
	const { values, positionals } = parseArgs({
		args,
		options: {
			output: { type: "string", short: "o" },
			fps: { type: "string" },
			help: { type: "boolean", short: "h" },
		},
		allowPositionals: true,
	})

	if (values.help) {
		printUsage()
		process.exit(0)
	}

	const configPath = positionals[0]
	if (!configPath) {
		console.error("Error: .video.json config file is required")
		printUsage()
		process.exit(1)
	}

	return {
		configPath,
		output: values.output ?? null,
		fpsOverride: values.fps ? Number(values.fps) : null,
	}
}

function printUsage(): void {
	console.log(`
Usage: bun run packages/video-export/src/index.ts [options] <config.video.json>

Options:
  -o, --output <path>   出力パス (デフォルト: <config>.mp4)
  --fps <number>        FPS (JSON の値を上書き)
  -h, --help            ヘルプを表示
`)
}
