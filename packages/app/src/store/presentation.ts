import {
	type AutoplayConfig,
	type AutoplayState,
	type Background,
	type Presentation,
	type SlideElement,
	type SlideShape,
	type SlideTransition,
	type ViewMode,
	createDefaultAutoplayConfig,
	createDefaultPresentation,
	createDefaultSlide,
	generateId,
	parsePresentation,
} from "@slidini/core"
import {
	applyColorSetToSlide,
	createSlideFromTemplate,
	getColorSetColors,
	getSlideTemplate,
	resolveOldColors,
} from "@slidini/templates"
import { create } from "zustand"

type PresentationStore = {
	// データ
	presentation: Presentation

	// 選択状態
	currentSlideIndex: number
	currentStep: number
	selectedElementId: string | null

	// 表示モード
	viewMode: ViewMode
	autoplayConfig: AutoplayConfig
	autoplayState: AutoplayState

	// 選択
	setCurrentSlideIndex: (index: number) => void
	setCurrentStep: (step: number) => void
	setSelectedElementId: (id: string | null) => void
	setViewMode: (mode: ViewMode) => void
	setAutoplayState: (state: AutoplayState) => void
	updateAutoplayConfig: (config: Partial<AutoplayConfig>) => void

	// メタ操作
	updateMeta: (updates: Partial<Presentation["meta"]>) => void

	// テンプレートピッカー
	isTemplatePickerOpen: boolean
	openTemplatePicker: () => void
	closeTemplatePicker: () => void
	addSlideFromTemplate: (templateId: string) => void

	// カラーセットピッカー
	isColorSetPickerOpen: boolean
	openColorSetPicker: () => void
	closeColorSetPicker: () => void
	applyColorSet: (colorSetId: string) => void
	applySlideColorSet: (slideId: string, colorSetId: string) => void
	clearSlideColorSet: (slideId: string) => void

	// スライド操作
	addSlide: () => void
	removeSlide: (slideId: string) => void
	reorderSlides: (fromIndex: number, toIndex: number) => void
	updateSlideBackground: (slideId: string, background: Background) => void
	updateSlideTransition: (slideId: string, transition: SlideTransition) => void
	updateSlideShape: (slideId: string, shape: SlideShape | undefined) => void

	// 要素操作
	addElement: (slideId: string, element: SlideElement) => void
	updateElement: (slideId: string, elementId: string, updates: Partial<SlideElement>) => void
	removeElement: (slideId: string, elementId: string) => void

	// オーバーレイ要素操作
	addOverlayElement: (layer: "background" | "foreground", element: SlideElement) => void
	updateOverlayElement: (
		layer: "background" | "foreground",
		elementId: string,
		updates: Partial<SlideElement>,
	) => void
	removeOverlayElement: (layer: "background" | "foreground", elementId: string) => void

	// JSON入出力
	exportJson: () => string
	importJson: (json: string) => boolean

	// 通知
	notification: string | null
	setNotification: (message: string | null) => void
}

export const usePresentationStore = create<PresentationStore>((set, get) => ({
	presentation: createDefaultPresentation(),
	currentSlideIndex: 0,
	currentStep: 0,
	selectedElementId: null,
	viewMode: "single",
	autoplayConfig: createDefaultAutoplayConfig(),
	autoplayState: "stopped",
	isTemplatePickerOpen: false,
	isColorSetPickerOpen: false,

	setCurrentSlideIndex: (index) =>
		set({ currentSlideIndex: index, currentStep: 0, selectedElementId: null }),

	setCurrentStep: (step) => set({ currentStep: step }),

	setSelectedElementId: (id) => set({ selectedElementId: id }),

	setViewMode: (mode) =>
		set({
			viewMode: mode,
			autoplayState: mode === "autoplay" ? "running" : "stopped",
		}),

	setAutoplayState: (state) => set({ autoplayState: state }),

	updateAutoplayConfig: (config) =>
		set((s) => ({
			autoplayConfig: { ...s.autoplayConfig, ...config },
		})),

	openTemplatePicker: () => set({ isTemplatePickerOpen: true }),
	closeTemplatePicker: () => set({ isTemplatePickerOpen: false }),

	addSlideFromTemplate: (templateId) =>
		set((s) => {
			const template = getSlideTemplate(templateId)
			if (!template) return s
			const colorSetId = s.presentation.meta.colorSetId
			const colors = colorSetId ? getColorSetColors(colorSetId) : undefined
			const newSlide = createSlideFromTemplate(template, colors ?? undefined)
			const insertAt = s.currentSlideIndex + 1
			const slides = [
				...s.presentation.slides.slice(0, insertAt),
				newSlide,
				...s.presentation.slides.slice(insertAt),
			]
			return {
				presentation: {
					...s.presentation,
					slides,
					meta: {
						...s.presentation.meta,
						updatedAt: new Date().toISOString(),
					},
				},
				currentSlideIndex: insertAt,
				selectedElementId: null,
			}
		}),

	openColorSetPicker: () => set({ isColorSetPickerOpen: true }),
	closeColorSetPicker: () => set({ isColorSetPickerOpen: false }),

	applyColorSet: (colorSetId) =>
		set((s) => {
			const newColors = getColorSetColors(colorSetId)
			if (!newColors) return s
			const oldColors = resolveOldColors(s.presentation.meta.colorSetId, null)
			const slides = s.presentation.slides.map((slide) =>
				applyColorSetToSlide(slide, oldColors, newColors),
			)
			return {
				presentation: {
					...s.presentation,
					slides,
					meta: {
						...s.presentation.meta,
						colorSetId,
						updatedAt: new Date().toISOString(),
					},
				},
			}
		}),

	applySlideColorSet: (slideId, colorSetId) =>
		set((s) => {
			const newColors = getColorSetColors(colorSetId)
			if (!newColors) return s
			return {
				presentation: {
					...s.presentation,
					slides: s.presentation.slides.map((slide) => {
						if (slide.id !== slideId) return slide
						const oldColors = resolveOldColors(s.presentation.meta.colorSetId, slide.colorSetId)
						return { ...applyColorSetToSlide(slide, oldColors, newColors), colorSetId }
					}),
					meta: {
						...s.presentation.meta,
						updatedAt: new Date().toISOString(),
					},
				},
			}
		}),

	clearSlideColorSet: (slideId) =>
		set((s) => {
			const metaColorSetId = s.presentation.meta.colorSetId
			const metaColors = metaColorSetId ? getColorSetColors(metaColorSetId) : null
			return {
				presentation: {
					...s.presentation,
					slides: s.presentation.slides.map((slide) => {
						if (slide.id !== slideId || !slide.colorSetId) return slide
						if (metaColors) {
							const oldColors = resolveOldColors(null, slide.colorSetId)
							return {
								...applyColorSetToSlide(slide, oldColors, metaColors),
								colorSetId: null,
							}
						}
						return { ...slide, colorSetId: null }
					}),
					meta: {
						...s.presentation.meta,
						updatedAt: new Date().toISOString(),
					},
				},
			}
		}),

	updateMeta: (updates) =>
		set((s) => ({
			presentation: {
				...s.presentation,
				meta: {
					...s.presentation.meta,
					...updates,
					updatedAt: new Date().toISOString(),
				},
			},
		})),

	addSlide: () =>
		set((s) => {
			const current = s.presentation.slides[s.currentSlideIndex]
			const newSlide = current
				? {
						...createDefaultSlide(),
						background: structuredClone(current.background),
						transition: { ...current.transition },
					}
				: createDefaultSlide()
			const insertAt = s.currentSlideIndex + 1
			const slides = [
				...s.presentation.slides.slice(0, insertAt),
				newSlide,
				...s.presentation.slides.slice(insertAt),
			]
			return {
				presentation: {
					...s.presentation,
					slides,
					meta: {
						...s.presentation.meta,
						updatedAt: new Date().toISOString(),
					},
				},
				currentSlideIndex: insertAt,
				selectedElementId: null,
			}
		}),

	removeSlide: (slideId) =>
		set((s) => {
			const slides = s.presentation.slides.filter((sl) => sl.id !== slideId)
			if (slides.length === 0) return s
			const newIndex = Math.min(s.currentSlideIndex, slides.length - 1)
			return {
				presentation: {
					...s.presentation,
					slides,
					meta: {
						...s.presentation.meta,
						updatedAt: new Date().toISOString(),
					},
				},
				currentSlideIndex: newIndex,
				selectedElementId: null,
			}
		}),

	reorderSlides: (fromIndex, toIndex) =>
		set((s) => {
			const slides = [...s.presentation.slides]
			const [moved] = slides.splice(fromIndex, 1)
			if (!moved) return s
			slides.splice(toIndex, 0, moved)
			return {
				presentation: {
					...s.presentation,
					slides,
					meta: {
						...s.presentation.meta,
						updatedAt: new Date().toISOString(),
					},
				},
				currentSlideIndex: toIndex,
			}
		}),

	updateSlideBackground: (slideId, background) =>
		set((s) => ({
			presentation: {
				...s.presentation,
				slides: s.presentation.slides.map((sl) => (sl.id === slideId ? { ...sl, background } : sl)),
				meta: {
					...s.presentation.meta,
					updatedAt: new Date().toISOString(),
				},
			},
		})),

	updateSlideTransition: (slideId, transition) =>
		set((s) => ({
			presentation: {
				...s.presentation,
				slides: s.presentation.slides.map((sl) => (sl.id === slideId ? { ...sl, transition } : sl)),
				meta: {
					...s.presentation.meta,
					updatedAt: new Date().toISOString(),
				},
			},
		})),

	updateSlideShape: (slideId, shape) =>
		set((s) => ({
			presentation: {
				...s.presentation,
				slides: s.presentation.slides.map((sl) => (sl.id === slideId ? { ...sl, shape } : sl)),
				meta: {
					...s.presentation.meta,
					updatedAt: new Date().toISOString(),
				},
			},
		})),

	addElement: (slideId, element) =>
		set((s) => ({
			presentation: {
				...s.presentation,
				slides: s.presentation.slides.map((sl) =>
					sl.id === slideId ? { ...sl, elements: [...sl.elements, element] } : sl,
				),
				meta: {
					...s.presentation.meta,
					updatedAt: new Date().toISOString(),
				},
			},
			selectedElementId: element.id,
		})),

	updateElement: (slideId, elementId, updates) =>
		set((s) => ({
			presentation: {
				...s.presentation,
				slides: s.presentation.slides.map((sl) =>
					sl.id === slideId
						? {
								...sl,
								elements: sl.elements.map((el) =>
									el.id === elementId ? ({ ...el, ...updates } as SlideElement) : el,
								),
							}
						: sl,
				),
				meta: {
					...s.presentation.meta,
					updatedAt: new Date().toISOString(),
				},
			},
		})),

	removeElement: (slideId, elementId) =>
		set((s) => ({
			presentation: {
				...s.presentation,
				slides: s.presentation.slides.map((sl) =>
					sl.id === slideId
						? {
								...sl,
								elements: sl.elements.filter((el) => el.id !== elementId),
							}
						: sl,
				),
				meta: {
					...s.presentation.meta,
					updatedAt: new Date().toISOString(),
				},
			},
			selectedElementId: s.selectedElementId === elementId ? null : s.selectedElementId,
		})),

	addOverlayElement: (layer, element) =>
		set((s) => {
			const key = layer === "background" ? "overlayBackgroundElements" : "overlayForegroundElements"
			return {
				presentation: {
					...s.presentation,
					[key]: [...(s.presentation[key] ?? []), element],
					meta: { ...s.presentation.meta, updatedAt: new Date().toISOString() },
				},
				selectedElementId: element.id,
			}
		}),

	updateOverlayElement: (layer, elementId, updates) =>
		set((s) => {
			const key = layer === "background" ? "overlayBackgroundElements" : "overlayForegroundElements"
			return {
				presentation: {
					...s.presentation,
					[key]: (s.presentation[key] ?? []).map((el) =>
						el.id === elementId ? ({ ...el, ...updates } as SlideElement) : el,
					),
					meta: { ...s.presentation.meta, updatedAt: new Date().toISOString() },
				},
			}
		}),

	removeOverlayElement: (layer, elementId) =>
		set((s) => {
			const key = layer === "background" ? "overlayBackgroundElements" : "overlayForegroundElements"
			return {
				presentation: {
					...s.presentation,
					[key]: (s.presentation[key] ?? []).filter((el) => el.id !== elementId),
					meta: { ...s.presentation.meta, updatedAt: new Date().toISOString() },
				},
				selectedElementId: s.selectedElementId === elementId ? null : s.selectedElementId,
			}
		}),

	notification: null,

	setNotification: (message) => {
		set({ notification: message })
		if (message) {
			setTimeout(() => set({ notification: null }), 3000)
		}
	},

	exportJson: () => {
		const { presentation } = get()
		return JSON.stringify(presentation, null, 2)
	},

	importJson: (json) => {
		try {
			const data = JSON.parse(json)
			const result = parsePresentation(data)
			if (result.success) {
				set({
					presentation: result.data,
					currentSlideIndex: 0,
					currentStep: 0,
					selectedElementId: null,
				})
				return true
			}
			console.error("Validation errors:", result.error.issues)
			return false
		} catch (e) {
			console.error("JSON parse error:", e)
			return false
		}
	},
}))
