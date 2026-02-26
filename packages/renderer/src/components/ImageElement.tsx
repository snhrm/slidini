import type { ImageElement as ImageElementType } from "@slidini/core"
import { motion } from "framer-motion"
import { useAnimation } from "../hooks/useAnimation"

type Props = {
	element: ImageElementType
	currentStep: number
}

export function ImageElement({ element, currentStep }: Props) {
	const animationProps = useAnimation(element.animations, currentStep)

	const fitStyle: Record<string, React.CSSProperties["objectFit"]> = {
		cover: "cover",
		contain: "contain",
		fill: "fill",
	}

	return (
		<motion.div {...animationProps} style={{ width: "100%", height: "100%" }}>
			{element.src ? (
				<img
					src={element.src}
					alt=""
					style={{
						width: "100%",
						height: "100%",
						objectFit: fitStyle[element.fit],
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
					画像未設定
				</div>
			)}
		</motion.div>
	)
}
