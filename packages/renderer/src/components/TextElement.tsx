import type { TextElement as TextElementType } from "@slidini/core"
import { motion } from "framer-motion"
import type { CSSProperties, ComponentPropsWithoutRef } from "react"
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

function CodeBlock({
	className,
	children,
	node,
	...rest
}: ComponentPropsWithoutRef<"code"> & { node?: { position?: unknown } }) {
	const match = /language-(\w+)/.exec(className || "")
	const code = String(children).replace(/\n$/, "")

	// Detect block code: has language OR content contains newlines (fenced code block)
	const isBlock = !!match || code.includes("\n")

	if (isBlock) {
		return (
			<SyntaxHighlighter
				style={vscDarkPlus}
				language={match?.[1] ?? "text"}
				PreTag="div"
				customStyle={{
					margin: 0,
					padding: "0.8em",
					borderRadius: "0.4em",
					fontSize: "inherit",
					lineHeight: "inherit",
				}}
				codeTagProps={{
					style: {
						fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
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
		<code
			{...rest}
			style={{
				color: "inherit",
				backgroundColor: "rgba(59, 130, 246, 0.15)",
				padding: "0.15em 0.4em",
				borderRadius: "0.25em",
				border: "1px solid rgba(59, 130, 246, 0.3)",
				fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
				fontSize: "0.85em",
			}}
		>
			{children}
		</code>
	)
}

const headingBase: CSSProperties = {
	fontSize: "inherit",
	fontWeight: "inherit",
	lineHeight: "inherit",
	margin: 0,
	padding: 0,
}

const markdownComponents = {
	h1: ({ children }: ComponentPropsWithoutRef<"h1">) => <h1 style={headingBase}>{children}</h1>,
	h2: ({ children }: ComponentPropsWithoutRef<"h2">) => <h2 style={headingBase}>{children}</h2>,
	h3: ({ children }: ComponentPropsWithoutRef<"h3">) => (
		<h3
			style={{
				...headingBase,
				fontSize: "0.85em",
				fontWeight: "bold",
				paddingBottom: "0.3em",
				marginBottom: "0.2em",
				borderBottom: "2px solid rgba(59, 130, 246, 0.3)",
			}}
		>
			{children}
		</h3>
	),
	h4: ({ children }: ComponentPropsWithoutRef<"h4">) => (
		<h4
			style={{
				...headingBase,
				fontSize: "0.75em",
				fontWeight: "bold",
				opacity: 0.85,
				letterSpacing: "0.05em",
				textTransform: "uppercase" as const,
			}}
		>
			{children}
		</h4>
	),
	p: ({ children }: ComponentPropsWithoutRef<"p">) => (
		<p style={{ margin: "0.4em 0", lineHeight: 1.6 }}>{children}</p>
	),
	ul: ({ children }: ComponentPropsWithoutRef<"ul">) => (
		<ul
			style={{
				margin: "0.5em 0",
				paddingLeft: 0,
				listStyle: "none",
				display: "flex",
				flexDirection: "column",
				gap: "0.4em",
			}}
		>
			{children}
		</ul>
	),
	ol: ({ children }: ComponentPropsWithoutRef<"ol">) => (
		<ol
			style={{
				margin: "0.5em 0",
				paddingLeft: 0,
				listStyle: "none",
				display: "flex",
				flexDirection: "column",
				gap: "0.4em",
			}}
		>
			{children}
		</ol>
	),
	li: ({ children }: ComponentPropsWithoutRef<"li">) => (
		<li
			style={{
				display: "flex",
				alignItems: "center",
				gap: "0.6em",
				lineHeight: 1.6,
				backgroundColor: "rgba(59, 130, 246, 0.08)",
				borderRadius: "0.3em",
				padding: "0.4em 0.7em",
				borderLeft: "0.2em solid rgba(59, 130, 246, 0.5)",
			}}
		>
			<span
				style={{
					flexShrink: 0,
					width: "0.4em",
					height: "0.4em",
					borderRadius: "50%",
					backgroundColor: "#3b82f6",
					opacity: 0.6,
				}}
			/>
			<span style={{ flex: 1 }}>{children}</span>
		</li>
	),
	table: ({ children }: ComponentPropsWithoutRef<"table">) => (
		<table
			style={{
				borderCollapse: "collapse",
				width: "100%",
				margin: "0.5em 0",
				borderRadius: "0.4em",
				overflow: "hidden",
			}}
		>
			{children}
		</table>
	),
	thead: ({ children }: ComponentPropsWithoutRef<"thead">) => (
		<thead
			style={{
				backgroundColor: "rgba(59, 130, 246, 0.12)",
				borderBottom: "2px solid rgba(59, 130, 246, 0.3)",
			}}
		>
			{children}
		</thead>
	),
	th: ({ children }: ComponentPropsWithoutRef<"th">) => (
		<th
			style={{
				padding: "0.5em 0.8em",
				textAlign: "left",
				fontWeight: "bold",
				borderRight: "1px solid rgba(59, 130, 246, 0.15)",
			}}
		>
			{children}
		</th>
	),
	td: ({ children }: ComponentPropsWithoutRef<"td">) => (
		<td
			style={{
				padding: "0.5em 0.8em",
				borderBottom: "1px solid rgba(59, 130, 246, 0.2)",
				borderRight: "1px solid rgba(59, 130, 246, 0.15)",
			}}
		>
			{children}
		</td>
	),
	a: ({ children }: ComponentPropsWithoutRef<"a">) => (
		<span
			style={{
				textDecoration: "underline",
				textDecorationColor: "color-mix(in srgb, currentColor 70%, transparent)",
				textUnderlineOffset: "0.15em",
				textDecorationThickness: "0.1em",
			}}
		>
			{children}
		</span>
	),
	blockquote: ({ children }: ComponentPropsWithoutRef<"blockquote">) => (
		<blockquote
			style={{
				borderLeft: "0.25em solid rgba(59, 130, 246, 0.6)",
				backgroundColor: "rgba(59, 130, 246, 0.06)",
				borderRadius: "0 0.3em 0.3em 0",
				padding: "0.5em 0.8em",
				margin: "0.5em 0",
				fontStyle: "italic",
				opacity: 0.9,
			}}
		>
			{children}
		</blockquote>
	),
	hr: () => (
		<hr
			style={{
				border: "none",
				height: "2px",
				background: "linear-gradient(to right, rgba(59, 130, 246, 0.4), transparent)",
				margin: "0.8em 0",
			}}
		/>
	),
	strong: ({ children }: ComponentPropsWithoutRef<"strong">) => (
		<strong
			style={{
				fontWeight: 900,
				letterSpacing: "0.02em",
			}}
		>
			{children}
		</strong>
	),
	em: ({ children }: ComponentPropsWithoutRef<"em">) => (
		<em style={{ fontStyle: "italic" }}>{children}</em>
	),
	del: ({ children }: ComponentPropsWithoutRef<"del">) => (
		<del style={{ textDecoration: "line-through", opacity: 0.6 }}>{children}</del>
	),
	code: CodeBlock,
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
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
			}}
		>
			<Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
				{element.content}
			</Markdown>
		</motion.div>
	)
}
