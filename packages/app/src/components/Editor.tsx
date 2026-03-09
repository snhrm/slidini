import { usePanelResize } from "../hooks/usePanelResize"
import { Canvas } from "./Canvas"
import { ColorSetPicker } from "./ColorSetPicker"
import { ElementList } from "./ElementList"
import { PlaybackBar } from "./PlaybackBar"
import { RightPanel } from "./RightPanel"
import { SlideList } from "./SlideList"
import { TemplatePicker } from "./TemplatePicker"
import { Toolbar } from "./Toolbar"

function ResizeHandle({
	side,
	onPointerDown,
}: {
	side: "left" | "right"
	onPointerDown: (side: "left" | "right", e: React.PointerEvent) => void
}) {
	return (
		<div
			onPointerDown={(e) => onPointerDown(side, e)}
			className="w-1 shrink-0 cursor-col-resize hover:bg-blue-500/40 active:bg-blue-500/60 transition-colors"
		/>
	)
}

export function Editor() {
	const { widths, onPointerDown } = usePanelResize()

	return (
		<div className="h-screen flex flex-col bg-gray-950 text-white">
			<Toolbar />
			<div className="flex flex-1 min-h-0">
				<ElementList width={widths.left} />
				<ResizeHandle side="left" onPointerDown={onPointerDown} />
				<Canvas />
				<ResizeHandle side="right" onPointerDown={onPointerDown} />
				<RightPanel width={widths.right} />
			</div>
			<PlaybackBar />
			<SlideList />
			<TemplatePicker />
			<ColorSetPicker />
		</div>
	)
}
