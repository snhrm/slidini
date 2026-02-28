import type { TextElement as TextElementType } from "@slidini/core"
import { motion } from "framer-motion"
import type { ComponentPropsWithoutRef } from "react"
import Markdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import remarkGfm from "remark-gfm"
import { useAnimation } from "../hooks/useAnimation"

type Props = {
	element: TextElementType
	currentStep: number
	isExiting?: boolean
}

function CodeBlock({ className, children, ...rest }: ComponentPropsWithoutRef<"code">) {
	const match = /language-(\w+)/.exec(className || "")
	const code = String(children).replace(/\n$/, "")

	if (match) {
		return (
			<SyntaxHighlighter
				style={vscDarkPlus}
				language={match[1]}
				PreTag="div"
				customStyle={{
					margin: 0,
					padding: 0,
					background: "transparent",
					fontSize: "inherit",
					lineHeight: "inherit",
				}}
				codeTagProps={{
					style: {
						fontFamily: "inherit",
						fontSize: "inherit",
						lineHeight: "inherit",
					},
				}}
			>
				{code}
			</SyntaxHighlighter>
		)
	}

	return (
		<code className={className} {...rest}>
			{children}
		</code>
	)
}

export function TextElement({ element, currentStep, isExiting }: Props) {
	const animationProps = useAnimation(element.animations, currentStep, isExiting)
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
			<Markdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>
				{element.content}
			</Markdown>
		</motion.div>
	)
}
