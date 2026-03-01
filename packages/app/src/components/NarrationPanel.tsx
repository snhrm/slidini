import { useCallback } from "react"
import { useShallow } from "zustand/react/shallow"
import { usePresentationStore } from "../store/presentation"

export function NarrationPanel() {
	const {
		currentSlideIndex,
		playback,
		updateSlideNarration,
		updateSlideAudioFile,
		updateSlideDuration,
	} = usePresentationStore(
		useShallow((s) => ({
			currentSlideIndex: s.currentSlideIndex,
			playback: s.presentation.playback,
			updateSlideNarration: s.updateSlideNarration,
			updateSlideAudioFile: s.updateSlideAudioFile,
			updateSlideDuration: s.updateSlideDuration,
		})),
	)

	const slideConfig = playback?.slides.find((s) => s.slideIndex === currentSlideIndex)

	const handleNarrationChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			updateSlideNarration(currentSlideIndex, e.target.value)
		},
		[currentSlideIndex, updateSlideNarration],
	)

	const handleDurationChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const val = e.target.value
			if (val === "") {
				updateSlideDuration(currentSlideIndex, null)
			} else {
				const num = Number.parseFloat(val)
				if (!Number.isNaN(num) && num > 0) {
					updateSlideDuration(currentSlideIndex, num)
				}
			}
		},
		[currentSlideIndex, updateSlideDuration],
	)

	const handleAudioUpload = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0]
			if (!file) return
			const reader = new FileReader()
			reader.onload = () => {
				if (typeof reader.result === "string") {
					updateSlideAudioFile(currentSlideIndex, reader.result)
				}
			}
			reader.readAsDataURL(file)
		},
		[currentSlideIndex, updateSlideAudioFile],
	)

	const handleClearAudio = useCallback(() => {
		updateSlideAudioFile(currentSlideIndex, null)
	}, [currentSlideIndex, updateSlideAudioFile])

	return (
		<div className="p-3 space-y-3">
			<label className="block">
				<span className="block text-xs text-gray-400 mb-1">
					ナレーション (Slide {currentSlideIndex + 1})
				</span>
				<textarea
					value={slideConfig?.narration ?? ""}
					onChange={handleNarrationChange}
					placeholder="ナレーションテキスト..."
					className="w-full h-20 px-2 py-1.5 text-xs bg-gray-800 text-white border border-gray-600 rounded resize-none"
				/>
			</label>

			<label className="block">
				<span className="block text-xs text-gray-400 mb-1">表示時間 (秒)</span>
				<input
					type="number"
					value={slideConfig?.duration ?? ""}
					onChange={handleDurationChange}
					placeholder="デフォルト: 5"
					min={0.5}
					step={0.5}
					className="w-full px-2 py-1 text-xs bg-gray-800 text-white border border-gray-600 rounded"
				/>
			</label>

			<div>
				<span className="block text-xs text-gray-400 mb-1">音声ファイル</span>
				{slideConfig?.audioFile ? (
					<div className="flex items-center gap-2">
						<span className="text-xs text-green-400 truncate flex-1">音声あり</span>
						<button
							type="button"
							onClick={handleClearAudio}
							className="px-2 py-0.5 text-xs bg-red-700 hover:bg-red-600 text-white rounded"
						>
							クリア
						</button>
					</div>
				) : (
					<label className="block">
						<span className="sr-only">音声ファイルを選択</span>
						<input
							type="file"
							accept="audio/*"
							onChange={handleAudioUpload}
							className="w-full text-xs text-gray-400 file:mr-2 file:px-2 file:py-0.5 file:text-xs file:bg-gray-700 file:text-white file:border-0 file:rounded file:cursor-pointer"
						/>
					</label>
				)}
			</div>
		</div>
	)
}
