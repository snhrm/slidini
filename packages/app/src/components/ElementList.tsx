import { useShallow } from "zustand/react/shallow"
import { usePresentationStore } from "../store/presentation"

const TYPE_LABELS: Record<string, string> = {
	text: "テキスト",
	image: "画像",
	video: "動画",
	chart: "チャート",
}

export function ElementList() {
	const { elements, selectedElementId, setSelectedElementId } = usePresentationStore(
		useShallow((s) => {
			const slide = s.presentation.slides[s.currentSlideIndex]
			return {
				elements: slide?.elements ?? [],
				selectedElementId: s.selectedElementId,
				setSelectedElementId: s.setSelectedElementId,
			}
		}),
	)

	return (
		<div className="w-48 bg-gray-900 border-r border-gray-700 flex flex-col">
			<div className="px-2 py-1.5 border-b border-gray-700">
				<span className="text-xs text-gray-400 font-medium">要素 ({elements.length})</span>
			</div>
			<div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
				{elements.length === 0 && (
					<p className="text-[10px] text-gray-500 px-1 py-2">要素がありません</p>
				)}
				{[...elements]
					.sort((a, b) => b.zIndex - a.zIndex)
					.map((el) => (
						<button
							type="button"
							key={el.id}
							onClick={() => setSelectedElementId(el.id)}
							className={`w-full text-left px-2 py-1 rounded text-xs transition-colors truncate ${
								selectedElementId === el.id
									? "bg-blue-600 text-white"
									: "text-gray-300 hover:bg-gray-800"
							}`}
						>
							<span className="text-gray-500 mr-1.5">{TYPE_LABELS[el.type] ?? el.type}</span>
							{el.type === "text" && "content" in el
								? (el.content as string).slice(0, 20).replace(/[#*_\n]/g, "")
								: el.id.slice(0, 16)}
						</button>
					))}
			</div>
		</div>
	)
}
