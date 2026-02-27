import type { Animation, AnimationType } from "@slidini/core"
import type { Easing, Variants } from "framer-motion"
import { useMemo } from "react"
import { toFramerEasing } from "./easing"

const variantMap: Record<AnimationType, Variants> = {
	"fade-in": { hidden: { opacity: 0 }, visible: { opacity: 1 } },
	"fade-out": { hidden: { opacity: 1 }, visible: { opacity: 0 } },
	"slide-in-left": { hidden: { x: "-100%" }, visible: { x: 0 } },
	"slide-in-right": { hidden: { x: "100%" }, visible: { x: 0 } },
	"slide-in-top": { hidden: { y: "-100%" }, visible: { y: 0 } },
	"slide-in-bottom": { hidden: { y: "100%" }, visible: { y: 0 } },
	"slide-out-left": { hidden: { x: 0 }, visible: { x: "-100%" } },
	"slide-out-right": { hidden: { x: 0 }, visible: { x: "100%" } },
	"slide-out-top": { hidden: { y: 0 }, visible: { y: "-100%" } },
	"slide-out-bottom": { hidden: { y: 0 }, visible: { y: "100%" } },
	"rotate-in": {
		hidden: { rotate: -180, opacity: 0 },
		visible: { rotate: 0, opacity: 1 },
	},
	"rotate-out": {
		hidden: { rotate: 0, opacity: 1 },
		visible: { rotate: 180, opacity: 0 },
	},
	"scale-in": {
		hidden: { scale: 0, opacity: 0 },
		visible: { scale: 1, opacity: 1 },
	},
	"scale-out": {
		hidden: { scale: 1, opacity: 1 },
		visible: { scale: 0, opacity: 0 },
	},
	// Spring-based entrance
	"bounce-in": {
		hidden: { scale: 0, opacity: 0 },
		visible: {
			scale: 1,
			opacity: 1,
			transition: { type: "spring", stiffness: 400, damping: 15 },
		},
	},
	"bounce-out": {
		hidden: { scale: 1, opacity: 1 },
		visible: {
			scale: 0,
			opacity: 0,
			transition: { type: "spring", stiffness: 400, damping: 15 },
		},
	},
	"elastic-in": {
		hidden: { scale: 0, opacity: 0 },
		visible: {
			scale: 1,
			opacity: 1,
			transition: { type: "spring", stiffness: 200, damping: 8 },
		},
	},
	"elastic-out": {
		hidden: { scale: 1, opacity: 1 },
		visible: {
			scale: 0,
			opacity: 0,
			transition: { type: "spring", stiffness: 200, damping: 8 },
		},
	},
	// 3D flip
	"flip-in": {
		hidden: { rotateY: -90, opacity: 0 },
		visible: { rotateY: 0, opacity: 1 },
	},
	"flip-out": {
		hidden: { rotateY: 0, opacity: 1 },
		visible: { rotateY: 90, opacity: 0 },
	},
	// Drop (from above with spring bounce)
	"drop-in": {
		hidden: { y: "-100%", opacity: 0 },
		visible: {
			y: 0,
			opacity: 1,
			transition: { type: "spring", stiffness: 300, damping: 20 },
		},
	},
	"drop-out": {
		hidden: { y: 0, opacity: 1 },
		visible: {
			y: "100%",
			opacity: 0,
			transition: { type: "spring", stiffness: 300, damping: 20 },
		},
	},
	// Continuous: float (gentle hovering)
	float: {
		hidden: { y: 0, opacity: 0 },
		visible: {
			y: [0, -20, 0],
			opacity: 1,
			transition: {
				y: {
					repeat: Number.POSITIVE_INFINITY,
					repeatType: "loop",
					duration: 3,
					ease: "easeInOut",
				},
				opacity: { duration: 0.5 },
			},
		},
	},
	// Continuous: pulse (breathing scale)
	pulse: {
		hidden: { scale: 1, opacity: 0 },
		visible: {
			scale: [1, 1.06, 1],
			opacity: 1,
			transition: {
				scale: {
					repeat: Number.POSITIVE_INFINITY,
					repeatType: "loop",
					duration: 2,
					ease: "easeInOut",
				},
				opacity: { duration: 0.5 },
			},
		},
	},
}

type AnimationProps = {
	initial: string
	animate: string
	variants: Variants
	transition: { duration: number; delay: number; ease: Easing }
}

const EMPTY: Record<string, never> = {}

export function useAnimation(
	animations: Animation[],
	currentStep: number,
): AnimationProps | Record<string, never> {
	return useMemo((): AnimationProps | Record<string, never> => {
		const enterAnimation = animations.find((a) => a.trigger === "onEnter")
		if (!enterAnimation) return EMPTY

		const isVisible = enterAnimation.stepIndex === 0 || currentStep >= enterAnimation.stepIndex

		const variants = variantMap[enterAnimation.type]
		if (!variants) return EMPTY

		return {
			initial: "hidden",
			animate: isVisible ? "visible" : "hidden",
			variants,
			transition: {
				duration: enterAnimation.duration,
				delay: enterAnimation.delay,
				ease: toFramerEasing(enterAnimation.easing),
			},
		}
	}, [animations, currentStep])
}

export function getMaxStepIndex(animations: Animation[]): number {
	return animations.reduce((max, a) => Math.max(max, a.stepIndex), 0)
}
