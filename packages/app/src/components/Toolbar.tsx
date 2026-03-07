import {
	createDefaultChartElement,
	createDefaultImageElement,
	createDefaultTextElement,
	createDefaultVideoElement,
} from "@slidini/core"
import { useShallow } from "zustand/react/shallow"
import { usePresentationStore } from "../store/presentation"
import { createMediaObjectUrls, readSlideJson } from "../utils/autoSave"
import { openDirectory } from "../utils/file"
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
		importData,
		setViewMode,
		setCurrentStep,
		setNotification,
		openColorSetPicker,
		enableAutoSave,
		disableAutoSave,
		setMediaUrlMap,
		setHashProjectName,
	} = usePresentationStore(
		useShallow((s) => ({
			presentation: s.presentation,
			currentSlideIndex: s.currentSlideIndex,
			viewMode: s.viewMode,
			autoSaveEnabled: s.autoSaveEnabled,
			autoSaveStatus: s.autoSaveStatus,
			addElement: s.addElement,
			addOverlayElement: s.addOverlayElement,
			importData: s.importData,
			setViewMode: s.setViewMode,
			setCurrentStep: s.setCurrentStep,
			setNotification: s.setNotification,
			openColorSetPicker: s.openColorSetPicker,
			enableAutoSave: s.enableAutoSave,
			disableAutoSave: s.disableAutoSave,
			setMediaUrlMap: s.setMediaUrlMap,
			setHashProjectName: s.setHashProjectName,
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

	const handleImport = async () => {
		if (autoSaveEnabled) {
			disableAutoSave()
		}
		try {
			if (supportsDirectoryPicker) {
				const dirHandle = await (
					window as unknown as {
						showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>
					}
				).showDirectoryPicker()

				const slideJson = await readSlideJson(dirHandle)
				if (!slideJson) {
					setNotification("フォルダ内に .slide.json が見つかりません")
					return
				}

				// Process with empty media map (keep filenames as-is)
				const result = processDirectoryFiles([slideJson], new Map())
				if (result.errors.length > 0 && !result.presentation && !result.playerConfig) {
					setNotification(result.errors[0] ?? "インポートエラー")
					return
				}

				// Create Object URLs for media files
				const mediaMap = await createMediaObjectUrls(dirHandle)
				importData(result)
				setMediaUrlMap(mediaMap)
				enableAutoSave(dirHandle)

				// projects/ 配下のプロジェクトならハッシュを更新
				const projectName = dirHandle.name
				const checkUrl = `/projects/${encodeURIComponent(projectName)}/${encodeURIComponent(projectName)}.slide.json`
				try {
					const res = await fetch(checkUrl, { method: "HEAD" })
					if (res.ok) {
						setHashProjectName(projectName)
						window.location.hash = `#/projects/${encodeURIComponent(projectName)}`
					}
				} catch {
					// projects/ 外のディレクトリ — ハッシュは更新しない
				}
			} else {
				const { jsonFiles, mediaFiles } = await openDirectory()
				const result = processDirectoryFiles(jsonFiles, mediaFiles)
				if (result.errors.length > 0 && !result.presentation && !result.playerConfig) {
					setNotification(result.errors[0] ?? "インポートエラー")
					return
				}
				setMediaUrlMap(new Map())
				importData(result)
			}
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
				<button
					type="button"
					onClick={handleImport}
					className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
				>
					インポート
				</button>
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
