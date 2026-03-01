import type {
	Background,
	ChartElement,
	ChartStyle,
	ChartType,
	FontCategory,
	SlideElement,
	SlideShape,
	SlideTransitionType,
	TextElement,
	TextStyle,
} from "@slidini/core"
import {
	ANIMATION_LABELS,
	ANIMATION_TYPES,
	AVAILABLE_FONTS,
	createDefaultAnimation,
} from "@slidini/core"
import { COLOR_SETS } from "@slidini/templates"
import { memo } from "react"
import { useShallow } from "zustand/react/shallow"
import { usePresentationStore } from "../store/presentation"
import { openImageFile, openVideoFile } from "../utils/file"

type OverlayContext = { layer: "background" | "foreground" }

export function PropertyPanel() {
	const { currentSlide, selectedElement, overlayContext } = usePresentationStore(
		useShallow((s) => {
			const slide = s.presentation.slides[s.currentSlideIndex]
			const id = s.selectedElementId
			if (id) {
				const slideEl = slide?.elements.find((el) => el.id === id)
				if (slideEl) return { currentSlide: slide, selectedElement: slideEl, overlayContext: null }
				const bgEl = s.presentation.overlayBackgroundElements?.find((el) => el.id === id)
				if (bgEl)
					return {
						currentSlide: slide,
						selectedElement: bgEl,
						overlayContext: { layer: "background" } as OverlayContext,
					}
				const fgEl = s.presentation.overlayForegroundElements?.find((el) => el.id === id)
				if (fgEl)
					return {
						currentSlide: slide,
						selectedElement: fgEl,
						overlayContext: { layer: "foreground" } as OverlayContext,
					}
			}
			return { currentSlide: slide, selectedElement: undefined, overlayContext: null }
		}),
	)

	return (
		<div>
			<div className="p-2 space-y-2">
				{selectedElement && overlayContext ? (
					<OverlayElementProperties element={selectedElement} layer={overlayContext.layer} />
				) : selectedElement && currentSlide ? (
					<ElementProperties element={selectedElement} slideId={currentSlide.id} />
				) : currentSlide ? (
					<SlideProperties slideId={currentSlide.id} />
				) : null}
			</div>
		</div>
	)
}

function SectionTitle({ children }: { children: React.ReactNode }) {
	return (
		<h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{children}</h3>
	)
}

function Label({ children }: { children: React.ReactNode }) {
	return <span className="text-[11px] text-gray-400 block">{children}</span>
}

const OverlayElementProperties = memo(function OverlayElementProperties({
	element,
	layer,
}: {
	element: SlideElement
	layer: "background" | "foreground"
}) {
	const { updateOverlayElement, removeOverlayElement } = usePresentationStore(
		useShallow((s) => ({
			updateOverlayElement: s.updateOverlayElement,
			removeOverlayElement: s.removeOverlayElement,
		})),
	)

	const update = (updates: Partial<SlideElement>) =>
		updateOverlayElement(layer, element.id, updates)

	const layerLabel = layer === "background" ? "背景" : "前面"
	const typeLabel =
		element.type === "text"
			? "テキスト"
			: element.type === "image"
				? "画像"
				: element.type === "video"
					? "動画"
					: "チャート"

	return (
		<>
			<div className="flex items-center justify-between">
				<SectionTitle>
					{layerLabel}オーバーレイ: {typeLabel}
				</SectionTitle>
				<button
					type="button"
					onClick={() => removeOverlayElement(layer, element.id)}
					className="text-xs text-red-400 hover:text-red-300 transition-colors"
				>
					削除
				</button>
			</div>

			<div className="flex gap-2">
				<div className="flex-1">
					<Label>X</Label>
					<input
						type="number"
						value={element.position.x}
						onChange={(e) =>
							update({ position: { ...element.position, x: Number(e.target.value) } })
						}
						className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
					/>
				</div>
				<div className="flex-1">
					<Label>Y</Label>
					<input
						type="number"
						value={element.position.y}
						onChange={(e) =>
							update({ position: { ...element.position, y: Number(e.target.value) } })
						}
						className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
					/>
				</div>
			</div>
			<div className="flex gap-2">
				<div className="flex-1">
					<Label>幅</Label>
					<input
						type="number"
						value={element.size.width}
						onChange={(e) => update({ size: { ...element.size, width: Number(e.target.value) } })}
						className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
					/>
				</div>
				<div className="flex-1">
					<Label>高さ</Label>
					<input
						type="number"
						value={element.size.height}
						onChange={(e) => update({ size: { ...element.size, height: Number(e.target.value) } })}
						className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
					/>
				</div>
			</div>
			<div>
				<Label>透明度 ({Math.round(element.opacity * 100)}%)</Label>
				<input
					type="range"
					min={0}
					max={1}
					step={0.05}
					value={element.opacity}
					onChange={(e) => update({ opacity: Number(e.target.value) })}
					className="w-full"
				/>
			</div>
			<div>
				<Label>重なり順 (z-index)</Label>
				<input
					type="number"
					value={element.zIndex}
					onChange={(e) => update({ zIndex: Number(e.target.value) })}
					className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
				/>
			</div>

			{element.type === "text" && <OverlayTextProperties element={element} layer={layer} />}
			{element.type === "image" && <OverlayImageProperties element={element} layer={layer} />}
		</>
	)
})

const OverlayTextProperties = memo(function OverlayTextProperties({
	element,
	layer,
}: { element: TextElement; layer: "background" | "foreground" }) {
	const updateOverlayElement = usePresentationStore((s) => s.updateOverlayElement)
	const updateStyle = (updates: Partial<TextStyle>) =>
		updateOverlayElement(layer, element.id, { style: { ...element.style, ...updates } })

	return (
		<>
			<div>
				<Label>テキスト (Markdown)</Label>
				<textarea
					value={element.content}
					onChange={(e) => updateOverlayElement(layer, element.id, { content: e.target.value })}
					rows={4}
					className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600 resize-y"
				/>
			</div>
			<div>
				<Label>テキスト色</Label>
				<input
					type="color"
					value={element.style.color}
					onChange={(e) => updateStyle({ color: e.target.value })}
					className="w-full h-8 rounded cursor-pointer"
				/>
			</div>
			<div>
				<Label>フォントサイズ ({element.style.fontSize}px)</Label>
				<input
					type="range"
					min={8}
					max={200}
					value={element.style.fontSize}
					onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })}
					className="w-full"
				/>
			</div>
		</>
	)
})

const OverlayImageProperties = memo(function OverlayImageProperties({
	element,
	layer,
}: { element: SlideElement & { type: "image" }; layer: "background" | "foreground" }) {
	const updateOverlayElement = usePresentationStore((s) => s.updateOverlayElement)

	return (
		<>
			<div>
				<Label>画像ソース</Label>
				<button
					type="button"
					onClick={async () => {
						try {
							const src = await openImageFile()
							updateOverlayElement(layer, element.id, { src })
						} catch {
							// cancelled
						}
					}}
					className="w-full px-2 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
				>
					画像を選択
				</button>
			</div>
			<div>
				<Label>フィット</Label>
				<select
					value={element.fit}
					onChange={(e) =>
						updateOverlayElement(layer, element.id, {
							fit: e.target.value as "cover" | "contain" | "fill",
						})
					}
					className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
				>
					<option value="contain">Contain</option>
					<option value="cover">Cover</option>
					<option value="fill">Fill</option>
				</select>
			</div>
		</>
	)
})

const SlideProperties = memo(function SlideProperties({ slideId }: { slideId: string }) {
	const {
		slide,
		updateSlideBackground,
		updateSlideTransition,
		updateSlideShape,
		updateMeta,
		meta,
		applySlideColorSet,
		clearSlideColorSet,
		autoplayConfig,
		updateAutoplayConfig,
	} = usePresentationStore(
		useShallow((s) => ({
			slide: s.presentation.slides.find((sl) => sl.id === slideId),
			meta: s.presentation.meta,
			updateSlideBackground: s.updateSlideBackground,
			updateSlideTransition: s.updateSlideTransition,
			updateSlideShape: s.updateSlideShape,
			updateMeta: s.updateMeta,
			applySlideColorSet: s.applySlideColorSet,
			clearSlideColorSet: s.clearSlideColorSet,
			autoplayConfig: s.autoplayConfig,
			updateAutoplayConfig: s.updateAutoplayConfig,
		})),
	)
	if (!slide) return null

	const updateBg = (bg: Background) => updateSlideBackground(slideId, bg)

	return (
		<>
			<div>
				<SectionTitle>スライド設定</SectionTitle>
			</div>

			<div>
				<Label>背景タイプ</Label>
				<select
					value={slide.background.type}
					onChange={(e) => {
						const type = e.target.value as Background["type"]
						if (type === "color") updateBg({ type: "color", value: "#1e293b" })
						else if (type === "image") updateBg({ type: "image", src: "", fit: "cover" })
						else
							updateBg({
								type: "gradient",
								gradient: {
									kind: "linear",
									angle: 135,
									stops: [
										{ color: "#667eea", position: 0 },
										{ color: "#764ba2", position: 100 },
									],
								},
							})
					}}
					className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
				>
					<option value="color">単色</option>
					<option value="image">画像</option>
					<option value="gradient">グラデーション</option>
				</select>
			</div>

			{slide.background.type === "color" && (
				<div>
					<Label>背景色</Label>
					<input
						type="color"
						value={slide.background.value}
						onChange={(e) => updateBg({ type: "color", value: e.target.value })}
						className="w-full h-8 rounded cursor-pointer"
					/>
				</div>
			)}

			{slide.background.type === "image" && (
				<div>
					<Label>背景画像</Label>
					<button
						type="button"
						onClick={async () => {
							try {
								const src = await openImageFile()
								updateBg({ type: "image", src, fit: "cover" })
							} catch {
								// cancelled
							}
						}}
						className="w-full px-2 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
					>
						画像を選択
					</button>
				</div>
			)}

			{slide.background.type === "gradient" && (
				<>
					<div>
						<Label>グラデーション方向</Label>
						<select
							value={slide.background.gradient.kind}
							onChange={(e) => {
								const bg = slide.background
								if (bg.type !== "gradient") return
								updateBg({
									...bg,
									gradient: {
										...bg.gradient,
										kind: e.target.value as "linear" | "radial",
									},
								})
							}}
							className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
						>
							<option value="linear">線形</option>
							<option value="radial">放射状</option>
						</select>
					</div>
					{slide.background.gradient.kind === "linear" && (
						<div>
							<Label>角度 ({slide.background.gradient.angle}°)</Label>
							<input
								type="range"
								min={0}
								max={360}
								value={slide.background.gradient.angle}
								onChange={(e) => {
									const bg = slide.background
									if (bg.type !== "gradient") return
									updateBg({
										...bg,
										gradient: {
											...bg.gradient,
											angle: Number(e.target.value),
										},
									})
								}}
								className="w-full"
							/>
						</div>
					)}
					{slide.background.gradient.stops.map((stop, i) => (
						<div key={`stop-${stop.position}`} className="flex gap-2 items-center">
							<input
								type="color"
								value={stop.color}
								onChange={(e) => {
									const bg = slide.background
									if (bg.type !== "gradient") return
									const stops = [...bg.gradient.stops]
									stops[i] = { ...stop, color: e.target.value }
									updateBg({
										...bg,
										gradient: { ...bg.gradient, stops },
									})
								}}
								className="w-8 h-8 rounded cursor-pointer"
							/>
							<span className="text-xs text-gray-400">{stop.position}%</span>
						</div>
					))}
				</>
			)}

			<div>
				<Label>スライドのカラーセット</Label>
				<select
					value={slide.colorSetId ?? ""}
					onChange={(e) => {
						const val = e.target.value
						if (val === "") {
							clearSlideColorSet(slideId)
						} else {
							applySlideColorSet(slideId, val)
						}
					}}
					className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
				>
					<option value="">プレゼンに従う</option>
					{COLOR_SETS.map((cs) => (
						<option key={cs.id} value={cs.id}>
							{cs.name}
						</option>
					))}
				</select>
			</div>

			<div>
				<Label>スライド形状</Label>
				<select
					value={slide.shape ?? "rectangle"}
					onChange={(e) => {
						const val = e.target.value as SlideShape
						updateSlideShape(slideId, val === "rectangle" ? undefined : val)
					}}
					className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
				>
					<option value="rectangle">四角形</option>
					<option value="circle">円形</option>
					<option value="rounded">角丸</option>
				</select>
			</div>

			<div>
				<Label>トランジション</Label>
				<select
					value={slide.transition.type}
					onChange={(e) =>
						updateSlideTransition(slideId, {
							...slide.transition,
							type: e.target.value as SlideTransitionType,
						})
					}
					className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
				>
					<optgroup label="基本">
						<option value="none">なし</option>
						<option value="fade">フェード</option>
						<option value="zoom">ズーム</option>
						<option value="rotate">回転</option>
						<option value="scale-fade">スケールフェード</option>
					</optgroup>
					<optgroup label="スライド">
						<option value="slide-left">左スライド</option>
						<option value="slide-right">右スライド</option>
						<option value="slide-up">上スライド</option>
						<option value="slide-down">下スライド</option>
					</optgroup>
					<optgroup label="フリップ">
						<option value="flip-x">フリップ(横)</option>
						<option value="flip-y">フリップ(縦)</option>
					</optgroup>
					<optgroup label="ワイプ">
						<option value="wipe-left">ワイプ(左)</option>
						<option value="wipe-right">ワイプ(右)</option>
						<option value="wipe-up">ワイプ(上)</option>
						<option value="wipe-down">ワイプ(下)</option>
					</optgroup>
					<optgroup label="3D キューブ">
						<option value="cube-left">キューブ(左)</option>
						<option value="cube-right">キューブ(右)</option>
						<option value="cube-up">キューブ(上)</option>
						<option value="cube-down">キューブ(下)</option>
					</optgroup>
					<optgroup label="ユニーク">
						<option value="page-turn">ページめくり</option>
						<option value="portal">ポータル</option>
					</optgroup>
				</select>
			</div>

			<div>
				<Label>トランジション時間 ({slide.transition.duration}s)</Label>
				<input
					type="range"
					min={0}
					max={2}
					step={0.1}
					value={slide.transition.duration}
					onChange={(e) =>
						updateSlideTransition(slideId, {
							...slide.transition,
							duration: Number(e.target.value),
						})
					}
					className="w-full"
				/>
			</div>

			<div>
				<SectionTitle>プレゼンテーション</SectionTitle>
			</div>

			<div>
				<Label>タイトル</Label>
				<input
					type="text"
					value={meta.title}
					onChange={(e) => updateMeta({ title: e.target.value })}
					className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
				/>
			</div>

			<div className="flex gap-2">
				<div className="flex-1">
					<Label>幅</Label>
					<input
						type="number"
						value={meta.width}
						onChange={(e) => updateMeta({ width: Number(e.target.value) })}
						className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
					/>
				</div>
				<div className="flex-1">
					<Label>高さ</Label>
					<input
						type="number"
						value={meta.height}
						onChange={(e) => updateMeta({ height: Number(e.target.value) })}
						className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
					/>
				</div>
			</div>

			<div>
				<SectionTitle>オートプレイ</SectionTitle>
			</div>

			<div>
				<Label>表示間隔 ({autoplayConfig.interval}秒)</Label>
				<input
					type="range"
					min={1}
					max={30}
					step={1}
					value={autoplayConfig.interval}
					onChange={(e) => updateAutoplayConfig({ interval: Number(e.target.value) })}
					className="w-full"
				/>
			</div>

			<div>
				<label className="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						checked={autoplayConfig.loop}
						onChange={(e) => updateAutoplayConfig({ loop: e.target.checked })}
						className="rounded"
					/>
					<span className="text-xs text-gray-300">ループ再生</span>
				</label>
			</div>
		</>
	)
})

const ElementProperties = memo(function ElementProperties({
	element,
	slideId,
}: {
	element: SlideElement
	slideId: string
}) {
	const { updateElement, removeElement } = usePresentationStore(
		useShallow((s) => ({
			updateElement: s.updateElement,
			removeElement: s.removeElement,
		})),
	)

	const update = (updates: Partial<SlideElement>) => updateElement(slideId, element.id, updates)

	return (
		<>
			<div className="flex items-center justify-between">
				<SectionTitle>
					{element.type === "text"
						? "テキスト"
						: element.type === "image"
							? "画像"
							: element.type === "video"
								? "動画"
								: "チャート"}
				</SectionTitle>
				<button
					type="button"
					onClick={() => removeElement(slideId, element.id)}
					className="text-xs text-red-400 hover:text-red-300 transition-colors"
				>
					削除
				</button>
			</div>

			{/* Position */}
			<div className="flex gap-2">
				<div className="flex-1">
					<Label>X</Label>
					<input
						type="number"
						value={element.position.x}
						onChange={(e) =>
							update({
								position: { ...element.position, x: Number(e.target.value) },
							})
						}
						className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
					/>
				</div>
				<div className="flex-1">
					<Label>Y</Label>
					<input
						type="number"
						value={element.position.y}
						onChange={(e) =>
							update({
								position: { ...element.position, y: Number(e.target.value) },
							})
						}
						className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
					/>
				</div>
			</div>

			{/* Size */}
			<div className="flex gap-2">
				<div className="flex-1">
					<Label>幅</Label>
					<input
						type="number"
						value={element.size.width}
						onChange={(e) =>
							update({
								size: { ...element.size, width: Number(e.target.value) },
							})
						}
						className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
					/>
				</div>
				<div className="flex-1">
					<Label>高さ</Label>
					<input
						type="number"
						value={element.size.height}
						onChange={(e) =>
							update({
								size: { ...element.size, height: Number(e.target.value) },
							})
						}
						className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
					/>
				</div>
			</div>

			{/* Rotation / Opacity / zIndex */}
			<div className="flex gap-2">
				<div className="flex-1">
					<Label>回転 ({element.rotation}°)</Label>
					<input
						type="range"
						min={-180}
						max={180}
						value={element.rotation}
						onChange={(e) => update({ rotation: Number(e.target.value) })}
						className="w-full"
					/>
				</div>
			</div>
			<div className="flex gap-2">
				<div className="flex-1">
					<Label>透明度 ({Math.round(element.opacity * 100)}%)</Label>
					<input
						type="range"
						min={0}
						max={1}
						step={0.05}
						value={element.opacity}
						onChange={(e) => update({ opacity: Number(e.target.value) })}
						className="w-full"
					/>
				</div>
			</div>
			<div>
				<Label>重なり順 (z-index)</Label>
				<input
					type="number"
					value={element.zIndex}
					onChange={(e) => update({ zIndex: Number(e.target.value) })}
					className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
				/>
			</div>

			{/* Type-specific properties */}
			{element.type === "text" && <TextProperties element={element} slideId={slideId} />}
			{element.type === "image" && <ImageProperties element={element} slideId={slideId} />}
			{element.type === "video" && <VideoProperties element={element} slideId={slideId} />}
			{element.type === "chart" && <ChartProperties element={element} slideId={slideId} />}

			{/* Animation */}
			<AnimationProperties element={element} slideId={slideId} />
		</>
	)
})

const TextProperties = memo(function TextProperties({
	element,
	slideId,
}: { element: TextElement; slideId: string }) {
	const updateElement = usePresentationStore((s) => s.updateElement)
	const updateStyle = (updates: Partial<TextStyle>) =>
		updateElement(slideId, element.id, {
			style: { ...element.style, ...updates },
		})

	return (
		<>
			<div>
				<Label>テキスト (Markdown)</Label>
				<textarea
					value={element.content}
					onChange={(e) =>
						updateElement(slideId, element.id, {
							content: e.target.value,
						})
					}
					rows={4}
					className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600 resize-y"
				/>
			</div>
			<div>
				<Label>テキスト色</Label>
				<input
					type="color"
					value={element.style.color}
					onChange={(e) => updateStyle({ color: e.target.value })}
					className="w-full h-8 rounded cursor-pointer"
				/>
			</div>
			<div>
				<Label>フォントサイズ ({element.style.fontSize}px)</Label>
				<input
					type="range"
					min={8}
					max={200}
					value={element.style.fontSize}
					onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })}
					className="w-full"
				/>
			</div>
			<div>
				<Label>フォントファミリー</Label>
				<select
					value={element.style.fontFamily}
					onChange={(e) => updateStyle({ fontFamily: e.target.value })}
					style={{ fontFamily: element.style.fontFamily }}
					className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
				>
					{(["ゴシック体", "明朝体", "見出し・デザイン向き"] as FontCategory[]).map((cat) => (
						<optgroup key={cat} label={cat}>
							{AVAILABLE_FONTS.filter((f) => f.category === cat).map((f) => (
								<option key={f.family} value={f.family} style={{ fontFamily: f.family }}>
									{f.family}
								</option>
							))}
						</optgroup>
					))}
				</select>
			</div>
			<div className="flex gap-2">
				<div className="flex-1">
					<Label>太さ</Label>
					<select
						value={element.style.fontWeight}
						onChange={(e) =>
							updateStyle({
								fontWeight: e.target.value as "normal" | "bold",
							})
						}
						className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
					>
						<option value="normal">標準</option>
						<option value="bold">太字</option>
					</select>
				</div>
				<div className="flex-1">
					<Label>スタイル</Label>
					<select
						value={element.style.fontStyle}
						onChange={(e) =>
							updateStyle({
								fontStyle: e.target.value as "normal" | "italic",
							})
						}
						className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
					>
						<option value="normal">標準</option>
						<option value="italic">イタリック</option>
					</select>
				</div>
			</div>
			<div className="flex gap-2">
				<div className="flex-1">
					<Label>装飾</Label>
					<select
						value={element.style.textDecoration}
						onChange={(e) =>
							updateStyle({
								textDecoration: e.target.value as "none" | "underline" | "line-through",
							})
						}
						className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
					>
						<option value="none">なし</option>
						<option value="underline">下線</option>
						<option value="line-through">取り消し線</option>
					</select>
				</div>
				<div className="flex-1">
					<Label>揃え</Label>
					<select
						value={element.style.textAlign}
						onChange={(e) =>
							updateStyle({
								textAlign: e.target.value as "left" | "center" | "right",
							})
						}
						className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
					>
						<option value="left">左</option>
						<option value="center">中央</option>
						<option value="right">右</option>
					</select>
				</div>
			</div>
			<div>
				<Label>行間 ({element.style.lineHeight})</Label>
				<input
					type="range"
					min={0.8}
					max={3}
					step={0.1}
					value={element.style.lineHeight}
					onChange={(e) => updateStyle({ lineHeight: Number(e.target.value) })}
					className="w-full"
				/>
			</div>
			<div>
				<Label>パディング ({element.style.padding}px)</Label>
				<input
					type="range"
					min={0}
					max={100}
					value={element.style.padding}
					onChange={(e) => updateStyle({ padding: Number(e.target.value) })}
					className="w-full"
				/>
			</div>
		</>
	)
})

const ImageProperties = memo(function ImageProperties({
	element,
	slideId,
}: { element: SlideElement & { type: "image" }; slideId: string }) {
	const updateElement = usePresentationStore((s) => s.updateElement)

	return (
		<>
			<div>
				<Label>画像ソース</Label>
				<button
					type="button"
					onClick={async () => {
						try {
							const src = await openImageFile()
							updateElement(slideId, element.id, { src })
						} catch {
							// cancelled
						}
					}}
					className="w-full px-2 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
				>
					画像を選択
				</button>
			</div>
			<div>
				<Label>フィット</Label>
				<select
					value={element.fit}
					onChange={(e) =>
						updateElement(slideId, element.id, {
							fit: e.target.value as "cover" | "contain" | "fill",
						})
					}
					className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
				>
					<option value="contain">Contain</option>
					<option value="cover">Cover</option>
					<option value="fill">Fill</option>
				</select>
			</div>
		</>
	)
})

const VideoProperties = memo(function VideoProperties({
	element,
	slideId,
}: { element: SlideElement & { type: "video" }; slideId: string }) {
	const updateElement = usePresentationStore((s) => s.updateElement)

	return (
		<>
			<div>
				<Label>動画ソース</Label>
				<button
					type="button"
					onClick={async () => {
						try {
							const src = await openVideoFile()
							updateElement(slideId, element.id, { src })
						} catch {
							// cancelled
						}
					}}
					className="w-full px-2 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
				>
					動画を選択
				</button>
			</div>
			<div className="space-y-1">
				<label className="flex items-center gap-2 text-xs text-gray-300">
					<input
						type="checkbox"
						checked={element.autoplay}
						onChange={(e) =>
							updateElement(slideId, element.id, {
								autoplay: e.target.checked,
							})
						}
					/>
					自動再生
				</label>
				<label className="flex items-center gap-2 text-xs text-gray-300">
					<input
						type="checkbox"
						checked={element.loop}
						onChange={(e) =>
							updateElement(slideId, element.id, {
								loop: e.target.checked,
							})
						}
					/>
					ループ
				</label>
				<label className="flex items-center gap-2 text-xs text-gray-300">
					<input
						type="checkbox"
						checked={element.muted}
						onChange={(e) =>
							updateElement(slideId, element.id, {
								muted: e.target.checked,
							})
						}
					/>
					ミュート
				</label>
			</div>
		</>
	)
})

const CHART_TYPE_LABELS: Record<ChartType, string> = {
	bar: "棒グラフ",
	line: "折れ線グラフ",
	pie: "円グラフ",
	donut: "ドーナツ",
	area: "エリア",
	radar: "レーダー",
}

const ChartProperties = memo(function ChartProperties({
	element,
	slideId,
}: { element: ChartElement; slideId: string }) {
	const updateElement = usePresentationStore((s) => s.updateElement)
	const update = (updates: Partial<ChartElement>) => updateElement(slideId, element.id, updates)
	const updateStyle = (updates: Partial<ChartStyle>) =>
		update({ style: { ...element.style, ...updates } })

	const updateSeriesField = (index: number, field: "name" | "color", value: string) => {
		const series = element.series.map((s, i) => (i === index ? { ...s, [field]: value } : s))
		update({ series })
	}

	const updateSeriesData = (index: number, value: string) => {
		const data = value
			.split(",")
			.map((v) => Number(v.trim()))
			.filter((v) => !Number.isNaN(v))
		const series = element.series.map((s, i) => (i === index ? { ...s, data } : s))
		update({ series })
	}

	const addSeries = () => {
		const colors = element.style.categoryColors
		const color = colors[element.series.length % colors.length] ?? "#667eea"
		update({
			series: [
				...element.series,
				{
					name: `系列${element.series.length + 1}`,
					data: element.categories.map(() => 0),
					color,
				},
			],
		})
	}

	const removeSeries = (index: number) => {
		if (element.series.length <= 1) return
		update({ series: element.series.filter((_, i) => i !== index) })
	}

	return (
		<>
			<div>
				<Label>グラフ種類</Label>
				<select
					value={element.chartType}
					onChange={(e) => update({ chartType: e.target.value as ChartType })}
					className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
				>
					{(Object.keys(CHART_TYPE_LABELS) as ChartType[]).map((t) => (
						<option key={t} value={t}>
							{CHART_TYPE_LABELS[t]}
						</option>
					))}
				</select>
			</div>

			<div>
				<Label>カテゴリ (カンマ区切り)</Label>
				<input
					type="text"
					value={element.categories.join(", ")}
					onChange={(e) =>
						update({
							categories: e.target.value.split(",").map((s) => s.trim()),
						})
					}
					className="w-full px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600"
				/>
			</div>

			<div className="flex items-center justify-between">
				<Label>データ系列</Label>
				<button
					type="button"
					onClick={addSeries}
					className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
				>
					+追加
				</button>
			</div>
			{element.series.map((s, i) => (
				<div
					key={`series-${s.name}`}
					className="space-y-1 p-2 bg-gray-800 rounded border border-gray-700"
				>
					<div className="flex items-center justify-between">
						<input
							type="text"
							value={s.name}
							onChange={(e) => updateSeriesField(i, "name", e.target.value)}
							className="flex-1 px-1 py-0.5 text-xs bg-gray-700 text-white rounded border border-gray-600"
						/>
						<input
							type="color"
							value={s.color}
							onChange={(e) => updateSeriesField(i, "color", e.target.value)}
							className="w-6 h-6 rounded cursor-pointer ml-1"
						/>
						{element.series.length > 1 && (
							<button
								type="button"
								onClick={() => removeSeries(i)}
								className="text-xs text-red-400 hover:text-red-300 ml-1"
							>
								×
							</button>
						)}
					</div>
					<input
						type="text"
						value={s.data.join(", ")}
						onChange={(e) => updateSeriesData(i, e.target.value)}
						placeholder="数値をカンマ区切り"
						className="w-full px-1 py-0.5 text-xs bg-gray-700 text-white rounded border border-gray-600"
					/>
				</div>
			))}

			<div className="space-y-1">
				<label className="flex items-center gap-2 text-xs text-gray-300">
					<input
						type="checkbox"
						checked={element.style.showLegend}
						onChange={(e) => updateStyle({ showLegend: e.target.checked })}
					/>
					凡例を表示
				</label>
				<label className="flex items-center gap-2 text-xs text-gray-300">
					<input
						type="checkbox"
						checked={element.style.showGrid}
						onChange={(e) => updateStyle({ showGrid: e.target.checked })}
					/>
					グリッドを表示
				</label>
				{(element.chartType === "bar" || element.chartType === "area") && (
					<label className="flex items-center gap-2 text-xs text-gray-300">
						<input
							type="checkbox"
							checked={element.style.stacked}
							onChange={(e) => updateStyle({ stacked: e.target.checked })}
						/>
						積み上げ
					</label>
				)}
			</div>

			{(element.chartType === "pie" || element.chartType === "donut") && (
				<div>
					<Label>内側半径 ({element.style.innerRadius}%)</Label>
					<input
						type="range"
						min={0}
						max={80}
						value={element.style.innerRadius}
						onChange={(e) => updateStyle({ innerRadius: Number(e.target.value) })}
						className="w-full"
					/>
				</div>
			)}

			<div>
				<Label>テキスト色</Label>
				<input
					type="color"
					value={element.style.textColor}
					onChange={(e) => updateStyle({ textColor: e.target.value })}
					className="w-full h-6 rounded cursor-pointer"
				/>
			</div>

			<div>
				<Label>フォントサイズ ({element.style.fontSize}px)</Label>
				<input
					type="range"
					min={8}
					max={32}
					value={element.style.fontSize}
					onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })}
					className="w-full"
				/>
			</div>
		</>
	)
})

const AnimationProperties = memo(function AnimationProperties({
	element,
	slideId,
}: { element: SlideElement; slideId: string }) {
	const updateElement = usePresentationStore((s) => s.updateElement)

	const addAnimation = () => {
		updateElement(slideId, element.id, {
			animations: [...element.animations, createDefaultAnimation()],
		})
	}

	const updateAnimation = (index: number, updates: Partial<SlideElement["animations"][number]>) => {
		const animations = element.animations.map((a, i) => (i === index ? { ...a, ...updates } : a))
		updateElement(slideId, element.id, { animations })
	}

	const removeAnimation = (index: number) => {
		const animations = element.animations.filter((_, i) => i !== index)
		updateElement(slideId, element.id, { animations })
	}

	return (
		<>
			<div className="flex items-center justify-between">
				<SectionTitle>アニメーション</SectionTitle>
				<button
					type="button"
					onClick={addAnimation}
					className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
				>
					+追加
				</button>
			</div>
			{element.animations.map((anim, index) => (
				<div
					key={`${anim.type}-${anim.trigger}-${index}`}
					className="space-y-2 p-2 bg-gray-800 rounded border border-gray-700"
				>
					<div className="flex items-center justify-between">
						<span className="text-xs text-gray-300">{ANIMATION_LABELS[anim.type]}</span>
						<button
							type="button"
							onClick={() => removeAnimation(index)}
							className="text-xs text-red-400 hover:text-red-300"
						>
							削除
						</button>
					</div>
					<select
						value={anim.type}
						onChange={(e) =>
							updateAnimation(index, {
								type: e.target.value as SlideElement["animations"][number]["type"],
							})
						}
						className="w-full px-2 py-1 text-xs bg-gray-700 text-white rounded border border-gray-600"
					>
						{ANIMATION_TYPES.map((t) => (
							<option key={t} value={t}>
								{ANIMATION_LABELS[t]}
							</option>
						))}
					</select>
					<div className="flex gap-2">
						<div className="flex-1">
							<span className="text-xs text-gray-500">時間</span>
							<input
								type="number"
								step={0.1}
								min={0}
								value={anim.duration}
								onChange={(e) =>
									updateAnimation(index, {
										duration: Number(e.target.value),
									})
								}
								className="w-full px-1 py-0.5 text-xs bg-gray-700 text-white rounded border border-gray-600"
							/>
						</div>
						<div className="flex-1">
							<span className="text-xs text-gray-500">遅延</span>
							<input
								type="number"
								step={0.1}
								min={0}
								value={anim.delay}
								onChange={(e) =>
									updateAnimation(index, {
										delay: Number(e.target.value),
									})
								}
								className="w-full px-1 py-0.5 text-xs bg-gray-700 text-white rounded border border-gray-600"
							/>
						</div>
						<div className="flex-1">
							<span className="text-xs text-gray-500">ステップ</span>
							<input
								type="number"
								min={0}
								value={anim.stepIndex}
								onChange={(e) =>
									updateAnimation(index, {
										stepIndex: Number(e.target.value),
									})
								}
								className="w-full px-1 py-0.5 text-xs bg-gray-700 text-white rounded border border-gray-600"
							/>
						</div>
					</div>
					<select
						value={anim.trigger}
						onChange={(e) =>
							updateAnimation(index, {
								trigger: e.target.value as "onEnter" | "onExit" | "onClick",
							})
						}
						className="w-full px-2 py-1 text-xs bg-gray-700 text-white rounded border border-gray-600"
					>
						<option value="onEnter">表示時</option>
						<option value="onExit">非表示時</option>
						<option value="onClick">クリック時</option>
					</select>
				</div>
			))}
		</>
	)
})
