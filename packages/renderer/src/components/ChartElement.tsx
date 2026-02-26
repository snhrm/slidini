import type { ChartElement as ChartElementType } from "@slidini/core"
import { motion } from "framer-motion"
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts"
import { useAnimation } from "../hooks/useAnimation"

type Props = {
	element: ChartElementType
	currentStep: number
}

export function ChartElement({ element, currentStep }: Props) {
	const animationProps = useAnimation(element.animations, currentStep)
	const { style, chartType, categories, series } = element

	const tickStyle = {
		fontSize: style.fontSize,
		fontFamily: style.fontFamily,
		fill: style.textColor,
	}

	const legendProps = style.showLegend
		? {
				verticalAlign:
					style.legendPosition === "top" || style.legendPosition === "bottom"
						? (style.legendPosition as "top" | "bottom")
						: ("middle" as const),
				align:
					style.legendPosition === "left" || style.legendPosition === "right"
						? (style.legendPosition as "left" | "right")
						: ("center" as const),
				wrapperStyle: { fontSize: style.fontSize, fontFamily: style.fontFamily },
			}
		: undefined

	return (
		<motion.div
			{...animationProps}
			style={{
				width: "100%",
				height: "100%",
				backgroundColor: style.backgroundColor ?? undefined,
			}}
		>
			<ResponsiveContainer width="100%" height="100%">
				{renderChart({ chartType, categories, series, style, tickStyle, legendProps })}
			</ResponsiveContainer>
		</motion.div>
	)
}

type RenderProps = {
	chartType: ChartElementType["chartType"]
	categories: string[]
	series: ChartElementType["series"]
	style: ChartElementType["style"]
	tickStyle: { fontSize: number; fontFamily: string; fill: string }
	legendProps:
		| {
				verticalAlign: "top" | "bottom" | "middle"
				align: "left" | "right" | "center"
				wrapperStyle: { fontSize: number; fontFamily: string }
		  }
		| undefined
}

function renderChart({
	chartType,
	categories,
	series,
	style,
	tickStyle,
	legendProps,
}: RenderProps) {
	const data = categories.map((cat, i) => {
		const entry: Record<string, string | number> = { name: cat }
		for (const s of series) {
			entry[s.name] = s.data[i] ?? 0
		}
		return entry
	})

	switch (chartType) {
		case "bar":
			return (
				<BarChart data={data}>
					{style.showGrid && <CartesianGrid strokeDasharray="3 3" stroke={style.gridColor} />}
					<XAxis dataKey="name" tick={tickStyle} />
					<YAxis tick={tickStyle} />
					<Tooltip />
					{legendProps && <Legend {...legendProps} />}
					{series.map((s) => (
						<Bar
							key={s.name}
							dataKey={s.name}
							fill={s.color}
							stackId={style.stacked ? "stack" : undefined}
						/>
					))}
				</BarChart>
			)

		case "line":
			return (
				<LineChart data={data}>
					{style.showGrid && <CartesianGrid strokeDasharray="3 3" stroke={style.gridColor} />}
					<XAxis dataKey="name" tick={tickStyle} />
					<YAxis tick={tickStyle} />
					<Tooltip />
					{legendProps && <Legend {...legendProps} />}
					{series.map((s) => (
						<Line
							key={s.name}
							type="monotone"
							dataKey={s.name}
							stroke={s.color}
							strokeWidth={2}
							dot={{ fill: s.color, r: 4 }}
						/>
					))}
				</LineChart>
			)

		case "area":
			return (
				<AreaChart data={data}>
					{style.showGrid && <CartesianGrid strokeDasharray="3 3" stroke={style.gridColor} />}
					<XAxis dataKey="name" tick={tickStyle} />
					<YAxis tick={tickStyle} />
					<Tooltip />
					{legendProps && <Legend {...legendProps} />}
					{series.map((s) => (
						<Area
							key={s.name}
							type="monotone"
							dataKey={s.name}
							stroke={s.color}
							fill={s.color}
							fillOpacity={0.3}
							stackId={style.stacked ? "stack" : undefined}
						/>
					))}
				</AreaChart>
			)

		case "pie":
		case "donut": {
			const pieData = categories.map((cat, i) => ({
				name: cat,
				value: series[0]?.data[i] ?? 0,
			}))
			const innerRadius = chartType === "donut" ? Math.max(style.innerRadius, 40) : 0
			return (
				<PieChart>
					<Pie
						data={pieData}
						dataKey="value"
						nameKey="name"
						cx="50%"
						cy="50%"
						innerRadius={`${innerRadius}%`}
						outerRadius="80%"
						startAngle={90 - style.startAngle}
						endAngle={90 - style.startAngle - 360}
						label={({ name }) => name}
						fontSize={style.fontSize}
						fontFamily={style.fontFamily}
					>
						{pieData.map((_, i) => (
							<Cell
								key={categories[i]}
								fill={style.categoryColors[i % style.categoryColors.length]}
							/>
						))}
					</Pie>
					<Tooltip />
					{legendProps && <Legend {...legendProps} />}
				</PieChart>
			)
		}

		case "radar": {
			const radarData = categories.map((cat, i) => {
				const entry: Record<string, string | number> = { subject: cat }
				for (const s of series) {
					entry[s.name] = s.data[i] ?? 0
				}
				return entry
			})
			return (
				<RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
					<PolarGrid stroke={style.gridColor} />
					<PolarAngleAxis dataKey="subject" tick={tickStyle} />
					<PolarRadiusAxis tick={tickStyle} />
					<Tooltip />
					{legendProps && <Legend {...legendProps} />}
					{series.map((s) => (
						<Radar
							key={s.name}
							name={s.name}
							dataKey={s.name}
							stroke={s.color}
							fill={s.color}
							fillOpacity={0.2}
						/>
					))}
				</RadarChart>
			)
		}
	}
}
