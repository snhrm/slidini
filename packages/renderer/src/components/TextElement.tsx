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
				color: "color-mix(in srgb, currentColor 70%, transparent)",
				backgroundColor: "color-mix(in srgb, currentColor 10%, transparent)",
				padding: "0.15em 0.4em",
				borderRadius: "0.25em",
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
		<h3 style={{ ...headingBase, fontSize: "0.85em", opacity: 0.85 }}>{children}</h3>
	),
	h4: ({ children }: ComponentPropsWithoutRef<"h4">) => (
		<h4 style={{ ...headingBase, fontSize: "0.75em", opacity: 0.8 }}>{children}</h4>
	),
	p: ({ children }: ComponentPropsWithoutRef<"p">) => (
		<p style={{ margin: "0.3em 0" }}>{children}</p>
	),
	ul: ({ children }: ComponentPropsWithoutRef<"ul">) => (
		<ul style={{ margin: "0.3em 0", paddingLeft: "1.5em", listStyleType: "disc" }}>{children}</ul>
	),
	ol: ({ children }: ComponentPropsWithoutRef<"ol">) => (
		<ol style={{ margin: "0.3em 0", paddingLeft: "1.5em", listStyleType: "decimal" }}>
			{children}
		</ol>
	),
	li: ({ children }: ComponentPropsWithoutRef<"li">) => (
		<li style={{ margin: "0.15em 0" }}>{children}</li>
	),
	table: ({ children }: ComponentPropsWithoutRef<"table">) => (
		<table
			style={{
				borderCollapse: "collapse",
				width: "100%",
				margin: "0.5em 0",
			}}
		>
			{children}
		</table>
	),
	thead: ({ children }: ComponentPropsWithoutRef<"thead">) => (
		<thead style={{ backgroundColor: "color-mix(in srgb, currentColor 10%, transparent)" }}>
			{children}
		</thead>
	),
	th: ({ children }: ComponentPropsWithoutRef<"th">) => (
		<th
			style={{
				padding: "0.5em 0.8em",
				textAlign: "left",
				fontWeight: "bold",
			}}
		>
			{children}
		</th>
	),
	td: ({ children }: ComponentPropsWithoutRef<"td">) => (
		<td
			style={{
				padding: "0.5em 0.8em",
				borderBottom: "1px solid currentColor",
				opacity: 0.9,
			}}
		>
			{children}
		</td>
	),
	a: ({ children, href }: ComponentPropsWithoutRef<"a">) => (
		<a
			href={href}
			style={{
				textDecoration: "underline",
				textUnderlineOffset: "0.15em",
			}}
		>
			{children}
		</a>
	),
	blockquote: ({ children }: ComponentPropsWithoutRef<"blockquote">) => (
		<blockquote
			style={{
				borderLeft: "0.2em solid currentColor",
				paddingLeft: "0.8em",
				margin: "0.5em 0",
				opacity: 0.8,
				fontStyle: "italic",
			}}
		>
			{children}
		</blockquote>
	),
	hr: () => (
		<hr
			style={{
				border: "none",
				borderTop: "1px solid currentColor",
				opacity: 0.3,
				margin: "0.8em 0",
			}}
		/>
	),
	strong: ({ children }: ComponentPropsWithoutRef<"strong">) => (
		<strong style={{ fontWeight: "bold" }}>{children}</strong>
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
			}}
		>
			<Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
				{element.content}
			</Markdown>
		</motion.div>
	)
}
