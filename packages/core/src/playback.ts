// ===== プレイヤー再生設定 =====

export type PlayerConfig = {
	defaultSlideDuration: number // seconds (default: 5)
	defaultStepDelay: number // seconds (default: 1)
	slides: SlidePlaybackConfig[] // empty = all slides use defaults
	bgm: BgmPlaybackConfig[] // empty = no BGM
}

export type SlidePlaybackConfig = {
	slideIndex: number
	narration?: string // narration text
	audioFile?: string // audio file URL or data URI
	duration?: number | null // seconds. null = auto from audio, undefined = use default
}

export type BgmPlaybackConfig = {
	src: string // URL or data URI
	volume: number // 0-1 (default: 0.15)
	loop: boolean // (default: true)
	fadeIn: number // seconds (default: 0)
	fadeOut: number // seconds (default: 0)
	startTime?: number // seconds (undefined = 0)
	endTime?: number // seconds (undefined = total duration)
}

export type SlideTiming = {
	slideIndex: number
	startTimeMs: number
	durationMs: number
	maxStep: number
	stepTimings: number[] // start time (ms) of each step within the slide
}

export function createDefaultPlayerConfig(): PlayerConfig {
	return {
		defaultSlideDuration: 5,
		defaultStepDelay: 1,
		slides: [],
		bgm: [],
	}
}
