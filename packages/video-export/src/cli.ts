import { parseArgs } from "node:util"

export type CliOptions = {
	configPath: string
	output: string | null
	fpsOverride: number | null
	forceRegenerateAudio: boolean
	scaleFactor: number
	workers: number | undefined
}

export function parseCli(args: string[]): CliOptions {
	const { values, positionals } = parseArgs({
		args,
		options: {
			output: { type: "string", short: "o" },
			fps: { type: "string" },
			workers: { type: "string", short: "w" },
			"regenerate-audio": { type: "boolean" },
			"4k": { type: "boolean" },
			scale: { type: "string" },
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
		console.error("Error: .slide.json file is required")
		printUsage()
		process.exit(1)
	}

	let scaleFactor = 2 // default: 4K (3840x2160)
	if (values["4k"]) {
		scaleFactor = 2
	} else if (values.scale) {
		scaleFactor = Number(values.scale)
	}

	return {
		configPath,
		output: values.output ?? null,
		fpsOverride: values.fps ? Number(values.fps) : null,
		forceRegenerateAudio: values["regenerate-audio"] ?? false,
		scaleFactor,
		workers: values.workers ? Number(values.workers) : undefined,
	}
}

function printUsage(): void {
	console.log(`
Usage: bun run packages/video-export/src/index.ts [options] <file.slide.json>

Options:
  -o, --output <path>   出力パス (デフォルト: <config>.mp4)
  --fps <number>        FPS (JSON の値を上書き)
  -w, --workers <num>   並列ワーカー数 (デフォルト: 自動判定)
  --4k                  4K解像度 (3840x2160) で書き出し
  --scale <number>      解像度倍率 (デフォルト: 2)
  --regenerate-audio    ナレーション音声を強制再生成
  -h, --help            ヘルプを表示
`)
}
