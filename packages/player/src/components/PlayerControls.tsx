import { useCallback } from "react"

type PlayerControlsProps = {
	isPlaying: boolean
	currentTimeMs: number
	totalDurationMs: number
	currentSlideIndex: number
	totalSlides: number
	onTogglePlayPause: () => void
	onSeek: (timeMs: number) => void
}

function formatTime(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000)
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60
	return `${minutes}:${String(seconds).padStart(2, "0")}`
}

export function PlayerControls({
	isPlaying,
	currentTimeMs,
	totalDurationMs,
	currentSlideIndex,
	totalSlides,
	onTogglePlayPause,
	onSeek,
}: PlayerControlsProps) {
	const handleSeekChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			onSeek(Number(e.target.value))
		},
		[onSeek],
	)

	const progress = totalDurationMs > 0 ? (currentTimeMs / totalDurationMs) * 100 : 0

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: 12,
				padding: "8px 16px",
				backgroundColor: "#1e293b",
				borderTop: "1px solid #334155",
				minHeight: 48,
			}}
		>
			<button
				type="button"
				onClick={onTogglePlayPause}
				style={{
					background: "none",
					border: "none",
					cursor: "pointer",
					padding: 4,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					color: "#e2e8f0",
					flexShrink: 0,
				}}
				aria-label={isPlaying ? "一時停止" : "再生"}
			>
				{isPlaying ? (
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="currentColor"
						role="img"
						aria-label="一時停止"
					>
						<rect x="6" y="4" width="4" height="16" rx="1" />
						<rect x="14" y="4" width="4" height="16" rx="1" />
					</svg>
				) : (
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="currentColor"
						role="img"
						aria-label="再生"
					>
						<path d="M8 5v14l11-7z" />
					</svg>
				)}
			</button>

			<div
				style={{ flex: 1, position: "relative", height: 20, display: "flex", alignItems: "center" }}
			>
				<div
					style={{
						position: "absolute",
						left: 0,
						right: 0,
						height: 4,
						backgroundColor: "#475569",
						borderRadius: 2,
					}}
				/>
				<div
					style={{
						position: "absolute",
						left: 0,
						width: `${progress}%`,
						height: 4,
						backgroundColor: "#3b82f6",
						borderRadius: 2,
						pointerEvents: "none",
					}}
				/>
				<input
					type="range"
					min={0}
					max={totalDurationMs}
					value={currentTimeMs}
					onChange={handleSeekChange}
					style={{
						position: "absolute",
						left: 0,
						right: 0,
						width: "100%",
						height: 20,
						opacity: 0,
						cursor: "pointer",
						margin: 0,
					}}
					aria-label="シーク"
				/>
			</div>

			<span
				style={{
					color: "#94a3b8",
					fontSize: 12,
					fontFamily: "monospace",
					whiteSpace: "nowrap",
					flexShrink: 0,
					minWidth: 90,
					textAlign: "right",
				}}
			>
				{formatTime(currentTimeMs)} / {formatTime(totalDurationMs)}
			</span>

			<span
				style={{
					color: "#64748b",
					fontSize: 11,
					whiteSpace: "nowrap",
					flexShrink: 0,
				}}
			>
				Slide {currentSlideIndex + 1}/{totalSlides}
			</span>
		</div>
	)
}
