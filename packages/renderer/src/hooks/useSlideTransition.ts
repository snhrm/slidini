import type { SlideTransition, SlideTransitionType } from "@slidini/core"
import type { TargetAndTransition } from "framer-motion"
import { toFramerEasing } from "./easing"

type TransitionVariant = {
	initial: TargetAndTransition
	animate: TargetAndTransition
	exit: TargetAndTransition
}

const transitionVariants: Record<SlideTransitionType, TransitionVariant> = {
	none: { initial: {}, animate: {}, exit: {} },
	fade: {
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		exit: { opacity: 0 },
	},
	"slide-left": {
		initial: { x: "100%" },
		animate: { x: 0 },
		exit: { x: "-100%" },
	},
	"slide-right": {
		initial: { x: "-100%" },
		animate: { x: 0 },
		exit: { x: "100%" },
	},
	"slide-up": {
		initial: { y: "100%" },
		animate: { y: 0 },
		exit: { y: "-100%" },
	},
	"slide-down": {
		initial: { y: "-100%" },
		animate: { y: 0 },
		exit: { y: "100%" },
	},
	zoom: {
		initial: { scale: 0, opacity: 0 },
		animate: { scale: 1, opacity: 1 },
		exit: { scale: 0, opacity: 0 },
	},
	"flip-x": {
		initial: { rotateY: 90, opacity: 0 },
		animate: { rotateY: 0, opacity: 1 },
		exit: { rotateY: -90, opacity: 0 },
	},
	"flip-y": {
		initial: { rotateX: -90, opacity: 0 },
		animate: { rotateX: 0, opacity: 1 },
		exit: { rotateX: 90, opacity: 0 },
	},
	rotate: {
		initial: { rotate: -90, scale: 0, opacity: 0 },
		animate: { rotate: 0, scale: 1, opacity: 1 },
		exit: { rotate: 90, scale: 0, opacity: 0 },
	},
	"scale-fade": {
		initial: { scale: 0.8, opacity: 0 },
		animate: { scale: 1, opacity: 1 },
		exit: { scale: 1.2, opacity: 0 },
	},
	"wipe-left": {
		initial: { clipPath: "inset(0 100% 0 0)" },
		animate: { clipPath: "inset(0 0% 0 0)" },
		exit: { clipPath: "inset(0 0 0 100%)" },
	},
	"wipe-right": {
		initial: { clipPath: "inset(0 0 0 100%)" },
		animate: { clipPath: "inset(0 0 0 0%)" },
		exit: { clipPath: "inset(0 100% 0 0)" },
	},
	"wipe-up": {
		initial: { clipPath: "inset(100% 0 0 0)" },
		animate: { clipPath: "inset(0% 0 0 0)" },
		exit: { clipPath: "inset(0 0 100% 0)" },
	},
	"wipe-down": {
		initial: { clipPath: "inset(0 0 100% 0)" },
		animate: { clipPath: "inset(0 0 0% 0)" },
		exit: { clipPath: "inset(100% 0 0 0)" },
	},
}

export function useSlideTransition(transition: SlideTransition) {
	const variants = transitionVariants[transition.type]
	return {
		initial: variants.initial,
		animate: variants.animate,
		exit: variants.exit,
		transition: {
			duration: transition.duration,
			ease: toFramerEasing(transition.easing),
		},
	}
}
