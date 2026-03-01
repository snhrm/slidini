import { useCallback } from "react"
import { useShallow } from "zustand/react/shallow"
import { usePresentationStore } from "../store/presentation"

export function BgmPanel() {
	const { playback, addBgm, updateBgm, removeBgm } = usePresentationStore(
		useShallow((s) => ({
			playback: s.presentation.playback,
			addBgm: s.addBgm,
			updateBgm: s.updateBgm,
			removeBgm: s.removeBgm,
		})),
	)

	const bgmList = playback?.bgm ?? []

	const handleAddBgm = useCallback(() => {
		addBgm({
			src: "",
			volume: 0.15,
			loop: true,
			fadeIn: 0,
			fadeOut: 0,
		})
	}, [addBgm])

	const handleFileUpload = useCallback(
		(index: number, e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0]
			if (!file) return
			const reader = new FileReader()
			reader.onload = () => {
				if (typeof reader.result === "string") {
					updateBgm(index, { src: reader.result })
				}
			}
			reader.readAsDataURL(file)
		},
		[updateBgm],
	)

	return (
		<div className="p-3 space-y-3">
			<div className="flex items-center justify-between">
				<span className="text-xs text-gray-400">BGM</span>
				<button
					type="button"
					onClick={handleAddBgm}
					className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded"
				>
					追加
				</button>
			</div>

			{bgmList.map((bgm, index) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: stable list with index-based operations
					key={index}
					className="p-2 bg-gray-800 rounded space-y-2 border border-gray-700"
				>
					<div className="flex items-center justify-between">
						<span className="text-xs text-gray-300">BGM {index + 1}</span>
						<button
							type="button"
							onClick={() => removeBgm(index)}
							className="px-1.5 py-0.5 text-xs bg-red-700 hover:bg-red-600 text-white rounded"
						>
							削除
						</button>
					</div>

					<div>
						<span className="block text-xs text-gray-400 mb-1">ファイル</span>
						{bgm.src ? (
							<span className="text-xs text-green-400">音声あり</span>
						) : (
							<label className="block">
								<span className="sr-only">BGMファイルを選択</span>
								<input
									type="file"
									accept="audio/*"
									onChange={(e) => handleFileUpload(index, e)}
									className="w-full text-xs text-gray-400 file:mr-2 file:px-2 file:py-0.5 file:text-xs file:bg-gray-700 file:text-white file:border-0 file:rounded file:cursor-pointer"
								/>
							</label>
						)}
					</div>

					<label className="flex items-center gap-2">
						<span className="text-xs text-gray-400 shrink-0">音量</span>
						<input
							type="range"
							min={0}
							max={1}
							step={0.05}
							value={bgm.volume}
							onChange={(e) => updateBgm(index, { volume: Number(e.target.value) })}
							className="flex-1"
						/>
						<span className="text-xs text-gray-400 w-8 text-right">
							{Math.round(bgm.volume * 100)}%
						</span>
					</label>

					<div className="flex items-center gap-3">
						<label className="flex items-center gap-1 text-xs text-gray-400">
							<input
								type="checkbox"
								checked={bgm.loop}
								onChange={(e) => updateBgm(index, { loop: e.target.checked })}
							/>
							ループ
						</label>
					</div>

					<div className="flex gap-2">
						<label className="flex-1">
							<span className="block text-xs text-gray-400 mb-0.5">開始時間 (秒)</span>
							<input
								type="number"
								value={bgm.startTime ?? ""}
								min={0}
								step={0.5}
								onChange={(e) =>
									updateBgm(index, {
										startTime: e.target.value === "" ? undefined : Number(e.target.value),
									})
								}
								placeholder="0"
								className="w-full px-1.5 py-0.5 text-xs bg-gray-700 text-white border border-gray-600 rounded"
							/>
						</label>
						<label className="flex-1">
							<span className="block text-xs text-gray-400 mb-0.5">終了時間 (秒)</span>
							<input
								type="number"
								value={bgm.endTime ?? ""}
								min={0}
								step={0.5}
								onChange={(e) =>
									updateBgm(index, {
										endTime: e.target.value === "" ? undefined : Number(e.target.value),
									})
								}
								placeholder="全体"
								className="w-full px-1.5 py-0.5 text-xs bg-gray-700 text-white border border-gray-600 rounded"
							/>
						</label>
					</div>

					<div className="flex gap-2">
						<label className="flex-1">
							<span className="block text-xs text-gray-400 mb-0.5">フェードイン (秒)</span>
							<input
								type="number"
								value={bgm.fadeIn}
								min={0}
								step={0.5}
								onChange={(e) => updateBgm(index, { fadeIn: Number(e.target.value) })}
								className="w-full px-1.5 py-0.5 text-xs bg-gray-700 text-white border border-gray-600 rounded"
							/>
						</label>
						<label className="flex-1">
							<span className="block text-xs text-gray-400 mb-0.5">フェードアウト (秒)</span>
							<input
								type="number"
								value={bgm.fadeOut}
								min={0}
								step={0.5}
								onChange={(e) => updateBgm(index, { fadeOut: Number(e.target.value) })}
								className="w-full px-1.5 py-0.5 text-xs bg-gray-700 text-white border border-gray-600 rounded"
							/>
						</label>
					</div>
				</div>
			))}
		</div>
	)
}
