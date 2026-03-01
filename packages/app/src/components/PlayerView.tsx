import { createDefaultPlayerConfig } from "@slidini/core"
import { VideoPlayer, computeSlideTimings } from "@slidini/player"
import { useMemo } from "react"
import { useShallow } from "zustand/react/shallow"
import { usePresentationStore } from "../store/presentation"
import { resolveAudioTracks } from "../utils/audio"
import { BgmPanel } from "./BgmPanel"
import { NarrationPanel } from "./NarrationPanel"
import { SlideList } from "./SlideList"

export function PlayerView() {
	const { presentation, selectedElementId, updateElement, setSelectedElementId } =
		usePresentationStore(
			useShallow((s) => ({
				presentation: s.presentation,
				selectedElementId: s.selectedElementId,
				updateElement: s.updateElement,
				setSelectedElementId: s.setSelectedElementId,
			})),
		)

	const effectiveConfig = presentation.playback ?? createDefaultPlayerConfig()

	const audioTracks = useMemo(() => {
		const timings = computeSlideTimings(presentation, effectiveConfig)
		return resolveAudioTracks(effectiveConfig, timings)
	}, [presentation, effectiveConfig])

	const currentSlide = usePresentationStore((s) => s.presentation.slides[s.currentSlideIndex])

	const handleElementUpdate = useMemo(() => {
		if (!currentSlide) return undefined
		return (elementId: string, updates: Parameters<typeof updateElement>[2]) => {
			updateElement(currentSlide.id, elementId, updates)
		}
	}, [currentSlide, updateElement])

	return (
		<div className="flex flex-1 min-h-0">
			<div className="w-48 flex-shrink-0 border-r border-gray-700 overflow-y-auto bg-gray-900">
				<SlideList />
			</div>

			<div className="flex-1 min-w-0">
				<VideoPlayer
					data={presentation}
					playerConfig={effectiveConfig}
					mode="edit"
					selectedElementId={selectedElementId}
					onElementSelect={setSelectedElementId}
					onElementUpdate={handleElementUpdate}
					audioTracks={audioTracks}
				/>
			</div>

			<div className="w-56 flex-shrink-0 border-l border-gray-700 overflow-y-auto bg-gray-900">
				<div className="border-b border-gray-700">
					<NarrationPanel />
				</div>
				<BgmPanel />
			</div>
		</div>
	)
}
