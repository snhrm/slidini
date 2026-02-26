import { Slide } from "@slidini/renderer"
import { useShallow } from "zustand/react/shallow"
import { usePresentationStore } from "../store/presentation"

export function SlideList() {
	const { slides, meta, currentSlideIndex, openTemplatePicker, setCurrentSlideIndex, removeSlide } =
		usePresentationStore(
			useShallow((s) => ({
				slides: s.presentation.slides,
				meta: s.presentation.meta,
				currentSlideIndex: s.currentSlideIndex,
				openTemplatePicker: s.openTemplatePicker,
				setCurrentSlideIndex: s.setCurrentSlideIndex,
				removeSlide: s.removeSlide,
			})),
		)

	return (
		<div className="w-48 bg-gray-900 border-r border-gray-700 flex flex-col">
			<div className="px-2 py-1.5 border-b border-gray-700 flex items-center justify-between">
				<span className="text-xs text-gray-400 font-medium">スライド ({slides.length})</span>
				<button
					type="button"
					onClick={openTemplatePicker}
					className="px-1.5 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
				>
					+追加
				</button>
			</div>
			<div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
				{slides.map((slide, index) => (
					<button
						type="button"
						key={slide.id}
						onClick={() => setCurrentSlideIndex(index)}
						className={`cursor-pointer rounded overflow-hidden border-2 transition-colors w-full text-left ${
							index === currentSlideIndex
								? "border-blue-500"
								: "border-transparent hover:border-gray-600"
						}`}
					>
						<div
							className="relative overflow-hidden"
							style={{ aspectRatio: `${meta.width}/${meta.height}` }}
						>
							<div
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									transform: `scale(${176 / meta.width})`,
									transformOrigin: "top left",
									width: meta.width,
									height: meta.height,
									pointerEvents: "none",
								}}
							>
								<Slide slide={slide} meta={meta} currentStep={0} mode="view" scale={1} />
							</div>
						</div>
						<div className="flex items-center justify-between px-1.5 py-0.5 bg-gray-800">
							<span className="text-[10px] text-gray-400">{index + 1}</span>
							{slides.length > 1 && (
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation()
										removeSlide(slide.id)
									}}
									className="text-[10px] text-gray-500 hover:text-red-400 transition-colors"
								>
									削除
								</button>
							)}
						</div>
					</button>
				))}
			</div>
		</div>
	)
}
