import { Presentation } from "@slidini/renderer"
import { useEffect, useState } from "react"
import { useShallow } from "zustand/react/shallow"
import { ColorSetPicker } from "./components/ColorSetPicker"
import { Editor } from "./components/Editor"
import { PlayerView } from "./components/PlayerView"
import { TemplatePicker } from "./components/TemplatePicker"
import { Toolbar } from "./components/Toolbar"
import { usePresentationStore } from "./store/presentation"

function Notification() {
	const { notification, setNotification } = usePresentationStore(
		useShallow((s) => ({
			notification: s.notification,
			setNotification: s.setNotification,
		})),
	)

	if (!notification) return null

	return (
		<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
			<div className="bg-red-600 text-white px-4 py-2 rounded shadow-lg flex items-center gap-3 text-sm">
				<span>{notification}</span>
				<button
					type="button"
					onClick={() => setNotification(null)}
					className="text-white/80 hover:text-white"
				>
					×
				</button>
			</div>
		</div>
	)
}

export function App() {
	const [isFullscreen, setIsFullscreen] = useState(false)
	const {
		presentation,
		currentSlideIndex,
		currentStep,
		viewMode,
		autoplayConfig,
		isPlayerMode,
		setCurrentSlideIndex,
		setCurrentStep,
	} = usePresentationStore(
		useShallow((s) => ({
			presentation: s.presentation,
			currentSlideIndex: s.currentSlideIndex,
			currentStep: s.currentStep,
			viewMode: s.viewMode,
			autoplayConfig: s.autoplayConfig,
			isPlayerMode: s.isPlayerMode,
			setCurrentSlideIndex: s.setCurrentSlideIndex,
			setCurrentStep: s.setCurrentStep,
		})),
	)

	useEffect(() => {
		const handler = () => {
			setIsFullscreen(!!document.fullscreenElement)
		}
		document.addEventListener("fullscreenchange", handler)
		return () => document.removeEventListener("fullscreenchange", handler)
	}, [])

	if (isFullscreen) {
		return (
			<div className="w-screen h-screen bg-black">
				<Presentation
					data={presentation}
					currentSlide={currentSlideIndex}
					currentStep={currentStep}
					viewMode={viewMode === "autoplay" ? "autoplay" : "single"}
					mode="view"
					autoplayConfig={autoplayConfig}
					onSlideChange={setCurrentSlideIndex}
					onStepChange={setCurrentStep}
				/>
			</div>
		)
	}

	if (isPlayerMode) {
		return (
			<div className="h-screen flex flex-col bg-gray-950 text-white">
				<Toolbar />
				<PlayerView />
				<TemplatePicker />
				<ColorSetPicker />
				<Notification />
			</div>
		)
	}

	return (
		<>
			<Editor />
			<Notification />
		</>
	)
}
