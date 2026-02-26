# @slidini/core

プレゼンテーションデータの型定義・Zodスキーマ・ファクトリ関数を提供するフレームワーク非依存パッケージ。

## インストール

```
bun add @slidini/core
```

## 主な型

| 型 | 説明 |
|---|------|
| `Presentation` | プレゼンテーション全体（メタ情報 + スライド配列 + オーバーレイ要素） |
| `PresentationMeta` | タイトル、サイズ(1920×1080)、作成・更新日時、カラーセットID |
| `Slide` | 個別スライド（背景・トランジション・要素配列） |
| `SlideElement` | 要素のユニオン型（Text \| Image \| Video \| Chart） |
| `Background` | 背景（color \| image \| gradient） |
| `SlideTransition` | スライド切り替えエフェクト（fade, slide-*, zoom, flip-*, rotate, scale-fade, wipe-*） |
| `Animation` | 要素アニメーション（fade-in/out, slide-in/out-*, rotate-in/out, scale-in/out） |
| `ChartElement` | グラフ要素（bar, line, pie, donut, area, radar） |
| `ViewMode` | 表示モード（single \| overview \| autoplay） |

## ファクトリ関数

```typescript
import {
  createDefaultPresentation,
  createDefaultSlide,
  createDefaultTextElement,
  createDefaultImageElement,
  createDefaultVideoElement,
  createDefaultChartElement,
  generateId,
} from "@slidini/core"

const presentation = createDefaultPresentation()
const slide = createDefaultSlide()
const text = createDefaultTextElement()
const id = generateId("slide") // "slide_abc123..."
```

## バリデーション

```typescript
import { parsePresentation } from "@slidini/core"

const result = parsePresentation(jsonData)
if (result.success) {
  console.log(result.data) // Presentation
} else {
  console.error(result.error.issues)
}
```

## 依存関係

- `zod` — スキーマ定義・バリデーション
