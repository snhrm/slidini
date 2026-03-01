import {
	createDefaultChartElement,
	createDefaultImageElement,
	createDefaultTextElement,
	createDefaultVideoElement,
	extractMediaFiles,
} from "@slidini/core"
import { useShallow } from "zustand/react/shallow"
import { usePresentationStore } from "../store/presentation"
import { downloadJson, openDirectory, saveToDirectory } from "../utils/file"
import { processDirectoryFiles } from "../utils/import"

const supportsDirectoryPicker = "showDirectoryPicker" in window

export function Toolbar() {
	const {
		presentation,
		currentSlideIndex,
		viewMode,
		autoSaveEnabled,
		autoSaveStatus,
		addElement,
		addOverlayElement,
		exportJson,
		importData,
		setViewMode,
		setCurrentStep,
		setNotification,
		openColorSetPicker,
		enableAutoSave,
		disableAutoSave,
	} = usePresentationStore(
		useShallow((s) => ({
			presentation: s.presentation,
			currentSlideIndex: s.currentSlideIndex,
			viewMode: s.viewMode,
			autoSaveEnabled: s.autoSaveEnabled,
			autoSaveStatus: s.autoSaveStatus,
			addElement: s.addElement,
			addOverlayElement: s.addOverlayElement,
			exportJson: s.exportJson,
			importData: s.importData,
			setViewMode: s.setViewMode,
			setCurrentStep: s.setCurrentStep,
			setNotification: s.setNotification,
			openColorSetPicker: s.openColorSetPicker,
			enableAutoSave: s.enableAutoSave,
			disableAutoSave: s.disableAutoSave,
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

	const handleExport = async () => {
		const title = presentation.meta.title || "presentation"
		const filename = `${title}.slide.json`
		const { cleanedPresentation, mediaFiles } = extractMediaFiles(presentation)

		if (mediaFiles.length > 0) {
			try {
				const json = JSON.stringify(cleanedPresentation, null, 2)
				await saveToDirectory(json, filename, mediaFiles)
			} catch {
				// user cancelled directory picker
			}
		} else {
			const json = exportJson()
			downloadJson(json, filename)
		}
	}

	const handleImport = async () => {
		if (autoSaveEnabled) {
			disableAutoSave()
		}
		try {
			const { jsonFiles, mediaFiles } = await openDirectory()
			const result = processDirectoryFiles(jsonFiles, mediaFiles)
			if (result.errors.length > 0 && !result.presentation && !result.playerConfig) {
				setNotification(result.errors[0] ?? "インポートエラー")
				return
			}
			importData(result)
		} catch {
			// user cancelled
		}
	}

	const handleToggleAutoSave = async () => {
		if (autoSaveEnabled) {
			disableAutoSave()
			return
		}
		try {
			const dirHandle = await (
				window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }
			).showDirectoryPicker()
			enableAutoSave(dirHandle)
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
					disabled={autoSaveEnabled}
					title={autoSaveEnabled ? "自動保存中はインポートできません" : undefined}
					className={`px-2 py-1 text-xs rounded transition-colors ${
						autoSaveEnabled
							? "bg-gray-800 text-gray-500 cursor-not-allowed"
							: "bg-gray-700 hover:bg-gray-600 text-white"
					}`}
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

			<div className="ml-auto flex items-center gap-1.5">
				{supportsDirectoryPicker && (
					<>
						<div className="flex items-center gap-1">
							<button
								type="button"
								onClick={handleToggleAutoSave}
								className={`px-2 py-1 text-xs rounded transition-colors ${
									autoSaveEnabled
										? "bg-green-700 hover:bg-green-600 text-white"
										: "bg-gray-700 hover:bg-gray-600 text-white"
								}`}
							>
								{autoSaveEnabled ? "自動保存 ON" : "自動保存"}
							</button>
							{autoSaveEnabled && autoSaveStatus === "saving" && (
								<span className="text-xs text-yellow-400">保存中...</span>
							)}
							{autoSaveEnabled && autoSaveStatus === "saved" && (
								<span className="text-xs text-green-400">保存済み</span>
							)}
							{autoSaveEnabled && autoSaveStatus === "error" && (
								<span className="text-xs text-red-400">エラー</span>
							)}
						</div>
						<div className="w-px h-5 bg-gray-600" />
					</>
				)}
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
