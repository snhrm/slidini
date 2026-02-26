import { Canvas } from "./Canvas"
import { ColorSetPicker } from "./ColorSetPicker"
import { ElementList } from "./ElementList"
import { PropertyPanel } from "./PropertyPanel"
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
				<PropertyPanel />
			</div>
			<SlideList />
			<TemplatePicker />
			<ColorSetPicker />
		</div>
	)
}
