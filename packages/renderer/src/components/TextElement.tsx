import type { TextElement as TextElementType } from "@slidini/core"
import { motion } from "framer-motion"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useAnimation } from "../hooks/useAnimation"

type Props = {
	element: TextElementType
	currentStep: number
}

export function TextElement({ element, currentStep }: Props) {
	const animationProps = useAnimation(element.animations, currentStep)
	const { style } = element

	return (
		<motion.div
			{...animationProps}
			style={{
				color: style.color,
				fontSize: style.fontSize,
				fontFamily: style.fontFamily,
				fontWeight: style.fontWeight,
				fontStyle: style.fontStyle,
				textDecoration: style.textDecoration,
				textAlign: style.textAlign,
				lineHeight: style.lineHeight,
				backgroundColor: style.backgroundColor ?? undefined,
				padding: style.padding,
				width: "100%",
				height: "100%",
				overflow: "hidden",
				wordBreak: "break-word",
			}}
		>
			<Markdown remarkPlugins={[remarkGfm]}>{element.content}</Markdown>
		</motion.div>
	)
}
