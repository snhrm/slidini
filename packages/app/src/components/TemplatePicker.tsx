import { Slide } from "@slidini/renderer"
import { SLIDE_TEMPLATES, createSlideFromTemplate } from "@slidini/templates"
import { useMemo } from "react"
import { useShallow } from "zustand/react/shallow"
import { usePresentationStore } from "../store/presentation"

const CATEGORIES = [
	{ key: "basic", label: "基本" },
	{ key: "content", label: "コンテンツ" },
	{ key: "media", label: "メディア" },
] as const

export function TemplatePicker() {
	const { isTemplatePickerOpen, closeTemplatePicker, addSlideFromTemplate, meta } =
		usePresentationStore(
			useShallow((s) => ({
				isTemplatePickerOpen: s.isTemplatePickerOpen,
				closeTemplatePicker: s.closeTemplatePicker,
				addSlideFromTemplate: s.addSlideFromTemplate,
				meta: s.presentation.meta,
			})),
		)

	const previewSlides = useMemo(
		() =>
			SLIDE_TEMPLATES.map((t) => ({
				template: t,
				slide: createSlideFromTemplate(t),
			})),
		[],
	)

	if (!isTemplatePickerOpen) return null

	const handleSelect = (templateId: string) => {
		addSlideFromTemplate(templateId)
		closeTemplatePicker()
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
			onClick={closeTemplatePicker}
			onKeyDown={(e) => {
				if (e.key === "Escape") closeTemplatePicker()
			}}
		>
			<div
				className="bg-gray-900 rounded-lg border border-gray-700 w-[800px] max-h-[80vh] flex flex-col"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={() => {}}
			>
				<div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
					<h2 className="text-lg font-bold text-white">テンプレートを選択</h2>
					<button
						type="button"
						onClick={closeTemplatePicker}
						className="text-gray-400 hover:text-white text-xl leading-none transition-colors"
					>
						✕
					</button>
				</div>
				<div className="flex-1 overflow-y-auto p-6 space-y-6">
					{CATEGORIES.map((cat) => {
						const items = previewSlides.filter((p) => p.template.category === cat.key)
						if (items.length === 0) return null
						return (
							<div key={cat.key}>
								<h3 className="text-sm font-medium text-gray-400 mb-3">{cat.label}</h3>
								<div className="grid grid-cols-3 gap-4">
									{items.map(({ template, slide }) => (
										<button
											type="button"
											key={template.id}
											onClick={() => handleSelect(template.id)}
											className="group cursor-pointer rounded-lg overflow-hidden border-2 border-gray-700 hover:border-blue-500 transition-colors bg-gray-800"
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
														transform: `scale(${228 / meta.width})`,
														transformOrigin: "top left",
														width: meta.width,
														height: meta.height,
														pointerEvents: "none",
													}}
												>
													<Slide slide={slide} meta={meta} currentStep={0} mode="view" scale={1} />
												</div>
											</div>
											<div className="px-3 py-2">
												<div className="text-sm text-white font-medium">{template.name}</div>
												<div className="text-xs text-gray-400 mt-0.5">{template.description}</div>
											</div>
										</button>
									))}
								</div>
							</div>
						)
					})}
				</div>
			</div>
		</div>
	)
}
