export type FontCategory = "ゴシック体" | "明朝体" | "見出し・デザイン向き"

export type FontDefinition = {
	family: string
	category: FontCategory
}

export const AVAILABLE_FONTS: FontDefinition[] = [
	{ family: "Noto Sans JP", category: "ゴシック体" },
	{ family: "Zen Kaku Gothic New", category: "ゴシック体" },
	{ family: "M PLUS 1p", category: "ゴシック体" },
	{ family: "M PLUS Rounded 1c", category: "ゴシック体" },
	{ family: "BIZ UDPGothic", category: "ゴシック体" },
	{ family: "Noto Serif JP", category: "明朝体" },
	{ family: "Shippori Mincho", category: "明朝体" },
	{ family: "Zen Antique", category: "明朝体" },
	{ family: "Dela Gothic One", category: "見出し・デザイン向き" },
	{ family: "Reggae One", category: "見出し・デザイン向き" },
	{ family: "Rampart One", category: "見出し・デザイン向き" },
	{ family: "Kiwi Maru", category: "見出し・デザイン向き" },
]

export function buildGoogleFontsUrl(families: string[]): string {
	const params = families.map((f) => `family=${f.replace(/ /g, "+")}`).join("&")
	return `https://fonts.googleapis.com/css2?${params}&display=swap`
}
