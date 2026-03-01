import { Canvas } from "./Canvas"
import { ColorSetPicker } from "./ColorSetPicker"
import { ElementList } from "./ElementList"
import { PlaybackBar } from "./PlaybackBar"
import { RightPanel } from "./RightPanel"
import { SlideList } from "./SlideList"
import { TemplatePicker } from "./TemplatePicker"
import { Toolbar } from "./Toolbar"

export function Editor() {
	return (
		<div className="h-screen flex flex-col bg-gray-950 text-white">
			<Toolbar />
			<div className="flex flex-1 min-h-0">
				<ElementList />
				<Canvas />
				<RightPanel />
			</div>
			<PlaybackBar />
			<SlideList />
			<TemplatePicker />
			<ColorSetPicker />
		</div>
	)
}
