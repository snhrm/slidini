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

	const THUMB_HEIGHT = 72

	return (
		<div className="h-36 bg-gray-900 border-t border-gray-700 flex flex-col pb-3">
			<div className="px-2 py-1 border-b border-gray-700 flex items-center justify-between shrink-0">
				<span className="text-xs text-gray-400 font-medium">スライド ({slides.length})</span>
				<button
					type="button"
					onClick={openTemplatePicker}
					className="px-1.5 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
				>
					+追加
				</button>
			</div>
			<div className="flex-1 overflow-x-auto overflow-y-hidden flex items-center gap-1.5 px-1.5">
				{slides.map((slide, index) => (
					<button
						type="button"
						key={slide.id}
						onClick={() => setCurrentSlideIndex(index)}
						className={`shrink-0 cursor-pointer rounded overflow-hidden border-2 transition-colors ${
							index === currentSlideIndex
								? "border-blue-500"
								: "border-transparent hover:border-gray-600"
						}`}
					>
						<div
							className="relative overflow-hidden"
							style={{
								width: THUMB_HEIGHT * (meta.width / meta.height),
								height: THUMB_HEIGHT,
							}}
						>
							<div
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									transform: `scale(${THUMB_HEIGHT / meta.height})`,
									transformOrigin: "top left",
									width: meta.width,
									height: meta.height,
									pointerEvents: "none",
								}}
							>
								<Slide slide={slide} meta={meta} currentStep={0} mode="view" scale={1} />
							</div>
						</div>
						<div className="flex items-center justify-between px-1.5 bg-gray-800">
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
