import type { ColorSetColors } from "@slidini/core"
import { COLOR_SETS } from "@slidini/templates"
import { useShallow } from "zustand/react/shallow"
import { usePresentationStore } from "../store/presentation"

function ColorSwatch({ colors }: { colors: ColorSetColors }) {
	const swatches = [
		{ key: "bg", color: colors.background },
		{ key: "primary", color: colors.textPrimary },
		{ key: "secondary", color: colors.textSecondary },
		{ key: "accent", color: colors.accent },
		{ key: "accent2", color: colors.accentSecondary },
	]
	return (
		<div className="flex gap-1">
			{swatches.map((s) => (
				<div
					key={s.key}
					className="w-5 h-5 rounded-full border border-gray-600"
					style={{ backgroundColor: s.color }}
				/>
			))}
		</div>
	)
}

export function ColorSetPicker() {
	const { isColorSetPickerOpen, closeColorSetPicker, applyColorSet, currentColorSetId } =
		usePresentationStore(
			useShallow((s) => ({
				isColorSetPickerOpen: s.isColorSetPickerOpen,
				closeColorSetPicker: s.closeColorSetPicker,
				applyColorSet: s.applyColorSet,
				currentColorSetId: s.presentation.meta.colorSetId,
			})),
		)

	if (!isColorSetPickerOpen) return null

	const handleSelect = (id: string) => {
		applyColorSet(id)
		closeColorSetPicker()
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
			onClick={closeColorSetPicker}
			onKeyDown={(e) => {
				if (e.key === "Escape") closeColorSetPicker()
			}}
		>
			<div
				className="bg-gray-900 rounded-lg border border-gray-700 w-[520px] max-h-[80vh] flex flex-col"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={() => {}}
			>
				<div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
					<h2 className="text-lg font-bold text-white">カラーセット</h2>
					<button
						type="button"
						onClick={closeColorSetPicker}
						className="text-gray-400 hover:text-white text-xl leading-none transition-colors"
					>
						✕
					</button>
				</div>
				<div className="flex-1 overflow-y-auto p-4 space-y-2">
					{COLOR_SETS.map((cs) => (
						<button
							type="button"
							key={cs.id}
							onClick={() => handleSelect(cs.id)}
							className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg border-2 transition-colors cursor-pointer ${
								currentColorSetId === cs.id
									? "border-blue-500 bg-gray-800"
									: "border-gray-700 hover:border-gray-500 bg-gray-800/50"
							}`}
						>
							<div
								className="w-10 h-10 rounded-lg shrink-0"
								style={{ backgroundColor: cs.colors.background }}
							>
								<div
									className="w-full h-full flex items-center justify-center text-xs font-bold rounded-lg"
									style={{ color: cs.colors.textPrimary }}
								>
									Aa
								</div>
							</div>
							<div className="flex-1 text-left">
								<div className="text-sm text-white font-medium">{cs.name}</div>
								<div className="mt-1">
									<ColorSwatch colors={cs.colors} />
								</div>
							</div>
							{currentColorSetId === cs.id && (
								<span className="text-xs text-blue-400 shrink-0">適用中</span>
							)}
						</button>
					))}
				</div>
			</div>
		</div>
	)
}
