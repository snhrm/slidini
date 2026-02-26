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
	// 3D Cube transitions (no opacity — 3D rotation handles visibility)
	"cube-left": {
		initial: { rotateY: 90 },
		animate: { rotateY: 0 },
		exit: { rotateY: -90 },
	},
	"cube-right": {
		initial: { rotateY: -90 },
		animate: { rotateY: 0 },
		exit: { rotateY: 90 },
	},
	"cube-up": {
		initial: { rotateX: -90 },
		animate: { rotateX: 0 },
		exit: { rotateX: 90 },
	},
	"cube-down": {
		initial: { rotateX: 90 },
		animate: { rotateX: 0 },
		exit: { rotateX: -90 },
	},
	// Page turn (book-like fold from left edge)
	"page-turn": {
		initial: { rotateY: -90 },
		animate: { rotateY: 0 },
		exit: { rotateY: 90 },
	},
	// Portal (circular reveal)
	portal: {
		initial: { clipPath: "circle(0% at 50% 50%)" },
		animate: { clipPath: "circle(75% at 50% 50%)" },
		exit: { clipPath: "circle(0% at 50% 50%)" },
	},
}

// Transitions that need 3D perspective on the parent container
const TRANSITIONS_3D = new Set<SlideTransitionType>([
	"cube-left",
	"cube-right",
	"cube-up",
	"cube-down",
	"page-turn",
])

// Transitions that need both slides visible simultaneously
const TRANSITIONS_SYNC = new Set<SlideTransitionType>([
	"cube-left",
	"cube-right",
	"cube-up",
	"cube-down",
	"page-turn",
])

export function is3DTransition(type: SlideTransitionType): boolean {
	return TRANSITIONS_3D.has(type)
}

export function isSyncTransition(type: SlideTransitionType): boolean {
	return TRANSITIONS_SYNC.has(type)
}

// Transform origins for cube faces: [entering, exiting]
const CUBE_ORIGINS: Partial<Record<SlideTransitionType, [string, string]>> = {
	"cube-left": ["left center", "right center"],
	"cube-right": ["right center", "left center"],
	"cube-up": ["center top", "center bottom"],
	"cube-down": ["center bottom", "center top"],
	"page-turn": ["left center", "left center"],
}

export function getCubeTransformOrigin(
	type: SlideTransitionType,
	isPresent: boolean,
): string | undefined {
	const origins = CUBE_ORIGINS[type]
	if (!origins) return undefined
	return isPresent ? origins[0] : origins[1]
}

export function useSlideTransition(transition: SlideTransition) {
	const variants = transitionVariants[transition.type] ?? transitionVariants.none
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
