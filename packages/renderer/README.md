# @slidini/renderer

プレゼンテーション描画用のReactコンポーネントライブラリ。インラインスタイルのみ使用（Tailwind非依存）で、将来的なnpmパッケージ化を想定。

## インストール

```
bun add @slidini/renderer
```

Peer dependencies: `react`, `react-dom` (^19.0.0)

## コンポーネント

### `<Presentation>`

メインコンテナ。ビューポートスケーリング、キーボード操作、オートプレイを管理。

```tsx
import { Presentation } from "@slidini/renderer"

<Presentation
  data={presentationData}
  currentSlide={0}
  currentStep={0}
  viewMode="single"
  mode="view"
  onSlideChange={(index) => {}}
  onStepChange={(step) => {}}
/>
```

| Prop | 説明 |
|------|------|
| `data` | `Presentation`型のデータ |
| `currentSlide` | 現在のスライドインデックス |
| `currentStep` | 現在のフラグメントステップ |
| `viewMode` | `"single"` \| `"overview"` \| `"autoplay"` |
| `mode` | `"edit"`（ドラッグ/リサイズ有効） \| `"view"`（キーボード操作有効） |
| `selectedElementId` | 選択中の要素ID（editモード） |
| `onElementSelect` | 要素選択コールバック（editモード） |
| `onElementUpdate` | 要素の位置・サイズ変更コールバック（editモード） |

### その他のコンポーネント

- `<Slide>` — 個別スライドの描画（背景 + 要素）
- `<SlideElement>` — 要素ディスパッチャ（editモード時にドラッグ/リサイズハンドル付き）
- `<TextElement>` — Markdownテキスト（react-markdown + remark-gfm）
- `<ImageElement>` — 画像（cover/contain/fill）
- `<VideoElement>` — 動画（autoplay, loop, muted対応）
- `<ChartElement>` — グラフ（Recharts）

## Hooks

- `useAnimation(animations, currentStep)` — 要素アニメーションのFramer Motionプロパティ生成
- `useSlideTransition(transition)` — スライド切り替えアニメーション
- `getMaxStepIndex(animations)` — フラグメント最大ステップ取得

## 設計方針

- スライドはネイティブ解像度（デフォルト1920×1080）で描画し、CSSの`transform: scale()`でコンテナにフィット
- editモードではドラッグ移動・リサイズハンドル・選択ハイライトを提供
- viewモードでは矢印キー・スペースキーでスライド/フラグメント送り

## 依存関係

- `@slidini/core` — 型定義
- `framer-motion` — アニメーション
- `react-markdown` / `remark-gfm` — Markdown描画
- `recharts` — グラフ描画
