import { useCallback, useEffect, useRef, useState } from "react"

const STORAGE_KEY = "slidini-panel-widths"

type PanelWidths = {
	left: number
	right: number
}

const DEFAULTS: PanelWidths = { left: 192, right: 240 }
const MIN_WIDTH = 120
const MAX_WIDTH = 480

function loadWidths(): PanelWidths {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return DEFAULTS
		const parsed = JSON.parse(raw) as Partial<PanelWidths>
		return {
			left: clamp(parsed.left ?? DEFAULTS.left),
			right: clamp(parsed.right ?? DEFAULTS.right),
		}
	} catch {
		return DEFAULTS
	}
}

function clamp(v: number): number {
	return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.round(v)))
}

export function usePanelResize() {
	const [widths, setWidths] = useState<PanelWidths>(loadWidths)
	const dragging = useRef<"left" | "right" | null>(null)
	const startX = useRef(0)
	const startWidth = useRef(0)

	const persist = useCallback((w: PanelWidths) => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(w))
	}, [])

	const onPointerDown = useCallback(
		(side: "left" | "right", e: React.PointerEvent) => {
			e.preventDefault()
			dragging.current = side
			startX.current = e.clientX
			startWidth.current = side === "left" ? widths.left : widths.right
			document.body.style.cursor = "col-resize"
			document.body.style.userSelect = "none"
		},
		[widths],
	)

	useEffect(() => {
		const onMove = (e: PointerEvent) => {
			const side = dragging.current
			if (!side) return
			const delta = e.clientX - startX.current
			const newWidth = clamp(
				side === "left" ? startWidth.current + delta : startWidth.current - delta,
			)
			setWidths((prev) => ({ ...prev, [side]: newWidth }))
		}

		const onUp = () => {
			if (!dragging.current) return
			dragging.current = null
			document.body.style.cursor = ""
			document.body.style.userSelect = ""
			setWidths((cur) => {
				persist(cur)
				return cur
			})
		}

		window.addEventListener("pointermove", onMove)
		window.addEventListener("pointerup", onUp)
		return () => {
			window.removeEventListener("pointermove", onMove)
			window.removeEventListener("pointerup", onUp)
		}
	}, [persist])

	return { widths, onPointerDown }
}
