import type { Easing } from "framer-motion"

const EASING_MAP: Record<string, Easing> = {
	linear: "linear",
	"ease-in": "easeIn",
	"ease-out": "easeOut",
	"ease-in-out": "easeInOut",
	easeIn: "easeIn",
	easeOut: "easeOut",
	easeInOut: "easeInOut",
}

export function toFramerEasing(value: string): Easing {
	return EASING_MAP[value] ?? "easeOut"
}
