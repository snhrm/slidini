import { useState } from "react"
import { BgmPanel } from "./BgmPanel"
import { NarrationPanel } from "./NarrationPanel"
import { PropertyPanel } from "./PropertyPanel"

type Tab = "element" | "playback"

export function RightPanel() {
	const [activeTab, setActiveTab] = useState<Tab>("element")

	return (
		<div className="w-60 flex-shrink-0 border-l border-gray-700 flex flex-col bg-gray-900">
			<div className="flex border-b border-gray-700 shrink-0">
				<button
					type="button"
					onClick={() => setActiveTab("element")}
					className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${
						activeTab === "element"
							? "text-white bg-gray-800 border-b-2 border-blue-500"
							: "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
					}`}
				>
					要素設定
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("playback")}
					className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${
						activeTab === "playback"
							? "text-white bg-gray-800 border-b-2 border-blue-500"
							: "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
					}`}
				>
					再生設定
				</button>
			</div>
			<div className="flex-1 overflow-y-auto">
				{activeTab === "element" ? (
					<PropertyPanel />
				) : (
					<>
						<NarrationPanel />
						<div className="border-t border-gray-700">
							<BgmPanel />
						</div>
					</>
				)}
			</div>
		</div>
	)
}
