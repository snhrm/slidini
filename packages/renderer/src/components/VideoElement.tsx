import type { VideoElement as VideoElementType } from "@slidini/core"
import { motion } from "framer-motion"
import { useAnimation } from "../hooks/useAnimation"

type Props = {
	element: VideoElementType
	currentStep: number
	isExiting?: boolean
}

export function VideoElement({ element, currentStep, isExiting }: Props) {
	const animationProps = useAnimation(element.animations, currentStep, isExiting)

	return (
		<motion.div {...animationProps} style={{ width: "100%", height: "100%" }}>
			{element.src ? (
				<video
					src={element.src}
					autoPlay={element.autoplay}
					loop={element.loop}
					muted={element.muted}
					controls
					style={{
						width: "100%",
						height: "100%",
						objectFit: "contain",
						display: "block",
					}}
				/>
			) : (
				<div
					style={{
						width: "100%",
						height: "100%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						backgroundColor: "rgba(255,255,255,0.1)",
						color: "rgba(255,255,255,0.5)",
						fontSize: 24,
					}}
				>
					動画未設定
				</div>
			)}
		</motion.div>
	)
}
