import {
	createDefaultChartElement,
	createDefaultImageElement,
	createDefaultTextElement,
	createDefaultVideoElement,
} from "@slidini/core"
import { useShallow } from "zustand/react/shallow"
import { usePresentationStore } from "../store/presentation"
import { downloadJson, openJsonFile } from "../utils/file"

export function Toolbar() {
	const {
		presentation,
		currentSlideIndex,
		viewMode,
		addElement,
		addOverlayElement,
		exportJson,
		importJson,
		setViewMode,
		setCurrentStep,
		setNotification,
		openColorSetPicker,
	} = usePresentationStore(
		useShallow((s) => ({
			presentation: s.presentation,
			currentSlideIndex: s.currentSlideIndex,
			viewMode: s.viewMode,
			addElement: s.addElement,
			addOverlayElement: s.addOverlayElement,
			exportJson: s.exportJson,
			importJson: s.importJson,
			setViewMode: s.setViewMode,
			setCurrentStep: s.setCurrentStep,
			setNotification: s.setNotification,
			openColorSetPicker: s.openColorSetPicker,
		})),
	)
	const currentSlide = presentation.slides[currentSlideIndex]

	const handleAddText = () => {
		if (!currentSlide) return
		addElement(currentSlide.id, createDefaultTextElement())
	}

	const handleAddImage = () => {
		if (!currentSlide) return
		addElement(currentSlide.id, createDefaultImageElement())
	}

	const handleAddVideo = () => {
		if (!currentSlide) return
		addElement(currentSlide.id, createDefaultVideoElement())
	}

	const handleAddChart = () => {
		if (!currentSlide) return
		addElement(currentSlide.id, createDefaultChartElement())
	}

	const handleExport = () => {
		const json = exportJson()
		const title = presentation.meta.title || "presentation"
		downloadJson(json, `${title}.slide.json`)
	}

	const handleImport = async () => {
		try {
			const json = await openJsonFile()
			const success = importJson(json)
			if (!success) {
				setNotification("JSONの形式が正しくありません")
			}
		} catch {
			// user cancelled
		}
	}

	const handlePresent = () => {
		setViewMode("single")
		setCurrentStep(0)
		document.documentElement.requestFullscreen?.()
	}

	return (
		<div className="flex items-center gap-1.5 bg-gray-900 border-b border-gray-700 px-2 py-1">
			<div className="flex items-center gap-0.5">
				<button
					type="button"
					onClick={handleAddText}
					className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
				>
					テキスト
				</button>
				<button
					type="button"
					onClick={handleAddImage}
					className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
				>
					画像
				</button>
				<button
					type="button"
					onClick={handleAddVideo}
					className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
				>
					動画
				</button>
				<button
					type="button"
					onClick={handleAddChart}
					className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
				>
					チャート
				</button>
			</div>

			<div className="w-px h-5 bg-gray-600" />

			<div className="flex items-center gap-0.5">
				<button
					type="button"
					onClick={handleImport}
					className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
				>
					インポート
				</button>
				<button
					type="button"
					onClick={handleExport}
					className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
				>
					エクスポート
				</button>
			</div>

			<div className="w-px h-5 bg-gray-600" />

			<button
				type="button"
				onClick={openColorSetPicker}
				className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
			>
				カラーセット
			</button>

			<div className="w-px h-5 bg-gray-600" />

			<div className="flex items-center gap-0.5">
				<button
					type="button"
					onClick={() => addOverlayElement("background", createDefaultTextElement())}
					className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
				>
					背景OL
				</button>
				<button
					type="button"
					onClick={() => addOverlayElement("foreground", createDefaultTextElement())}
					className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
				>
					前面OL
				</button>
			</div>

			<div className="w-px h-5 bg-gray-600" />

			<select
				value={viewMode}
				onChange={(e) => setViewMode(e.target.value as "single" | "overview" | "autoplay")}
				className="px-1.5 py-1 text-xs bg-gray-700 text-white rounded border border-gray-600"
			>
				<option value="single">シングル</option>
				<option value="overview">オーバービュー</option>
				<option value="autoplay">オートプレイ</option>
			</select>

			<div className="ml-auto">
				<button
					type="button"
					onClick={handlePresent}
					className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors font-medium"
				>
					プレゼンテーション
				</button>
			</div>
		</div>
	)
}
