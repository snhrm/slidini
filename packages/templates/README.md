# @slidini/templates

スライドテンプレートとカラーセットを提供するパッケージ。

## インストール

```
bun add @slidini/templates
```

## テンプレート

10種類のスライドテンプレートをJSON形式で定義。

| ID | 名前 | カテゴリ |
|----|------|----------|
| `title` | タイトル | basic |
| `title-subtitle` | タイトル+サブタイトル | basic |
| `section-divider` | セクション区切り | basic |
| `blank` | 空白 | basic |
| `title-body` | タイトル+本文 | content |
| `two-column` | 2カラム | content |
| `quote` | 引用 | content |
| `comparison` | 比較 | content |
| `image-caption` | 画像+キャプション | media |
| `full-image` | 全面画像 | media |

```typescript
import {
  SLIDE_TEMPLATES,
  getSlideTemplate,
  createSlideFromTemplate,
} from "@slidini/templates"

// テンプレート一覧
console.log(SLIDE_TEMPLATES.map((t) => t.name))

// テンプレートからスライド生成（IDが自動付与される）
const template = getSlideTemplate("title")
const slide = createSlideFromTemplate(template, colors)
```

テンプレート要素には `colorRole` / `bgColorRole` フィールドがあり、カラーセット適用時に動的にカラーがマッピングされる。

## カラーセット

6種類のカラーパレットを提供。プレゼンテーション全体またはスライド単位で適用可能。

| ID | 名前 |
|----|------|
| `darkSlate` | ダークスレート |
| `lightClean` | ライトクリーン |
| `midnightBlue` | ミッドナイトブルー |
| `warmSunset` | ウォームサンセット |
| `forestGreen` | フォレストグリーン |
| `monochrome` | モノクローム |

```typescript
import {
  COLOR_SETS,
  getColorSetColors,
  applyColorSetToSlide,
  resolveOldColors,
} from "@slidini/templates"

// カラーセット適用
const newColors = getColorSetColors("midnightBlue")
const oldColors = resolveOldColors(currentColorSetId, null)
const updatedSlide = applyColorSetToSlide(slide, oldColors, newColors)
```

## 依存関係

- `@slidini/core` — 型定義
