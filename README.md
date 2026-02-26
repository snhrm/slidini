# slidini

TypeScript + React で構築されたスライド作成・プレゼンテーションアプリ。

将来的にレンダラーをライブラリとして切り出すことを見据え、Bun workspace モノレポで **core / renderer / app** の 3 パッケージに分離した構成。

## 技術スタック

| 領域 | 技術 |
|------|------|
| ランタイム / パッケージ管理 | Bun (workspaces) |
| ビルド | Vite 6 |
| UI | React 19 |
| アニメーション | Framer Motion 12 |
| Markdown | react-markdown + remark-gfm |
| 状態管理 | Zustand 5 |
| スタイリング | Tailwind CSS 4 (app のみ)、renderer はインラインスタイル |
| バリデーション | Zod 3 |
| Lint / Format | Biome |
| 型チェック | TypeScript 5 (strict) |

## セットアップ

```bash
bun install
bun run dev       # Vite 開発サーバー起動
```

## スクリプト

| コマンド | 内容 |
|---------|------|
| `bun run dev` | 開発サーバー起動 |
| `bun run build` | プロダクションビルド |
| `bun run typecheck` | 全パッケージの型チェック |
| `bun run check` | Biome による lint / format チェック |
| `bun run format` | Biome による自動フォーマット |

---

## アーキテクチャ

### パッケージ構成

```
slidini/
├── packages/
│   ├── core/           # 型定義・Zod スキーマ・デフォルト値（フレームワーク非依存）
│   ├── renderer/       # React スライドレンダラー（将来ライブラリ化対象）
│   └── app/            # エディタ UI（Vite + React + Tailwind + Zustand）
├── plan/               # 設計ドキュメント
├── biome.json
├── tsconfig.json
└── package.json        # ワークスペースルート
```

### 依存グラフ

```
app ──depends──▶ renderer ──depends──▶ core
 │                                      ▲
 └────────────depends───────────────────┘
```

- **core** は外部依存が zod のみ。React に依存しない。
- **renderer** は React + Framer Motion で描画を担当。Tailwind に依存しない（インラインスタイルで完結）。
- **app** は Tailwind でエディタ UI を構築し、renderer を埋め込む。

---

## `@slidini/core`

フレームワーク非依存の型定義・バリデーション・ファクトリ関数を提供する。

### データモデル

```
Presentation
├── meta: PresentationMeta
│   ├── schemaVersion    # スキーマバージョン (現在 1)
│   ├── title
│   ├── width / height   # スライドサイズ (デフォルト 1920×1080)
│   ├── createdAt        # ISO 8601
│   └── updatedAt
│
└── slides: Slide[]
    ├── id
    ├── background       # color | image | gradient
    ├── transition       # none | fade | slide-* | zoom
    └── elements: SlideElement[]
        ├── TextElement   # Markdown テキスト + TextStyle
        ├── ImageElement  # URL or Base64 data URI
        └── VideoElement  # URL or Base64 data URI
```

### 要素の共通プロパティ (BaseElement)

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `id` | `string` | 一意な識別子 |
| `position` | `{ x, y }` | 絶対座標 (px) |
| `size` | `{ width, height }` | サイズ (px) |
| `rotation` | `number` | 回転角度 (deg) |
| `opacity` | `number` | 透明度 (0–1) |
| `zIndex` | `number` | 重なり順 |
| `animations` | `Animation[]` | アニメーション設定 |

### TextStyle

色・サイズ・フォント以外に `fontWeight`, `fontStyle`, `textDecoration`, `textAlign`, `lineHeight`, `backgroundColor`, `padding` をサポート。

### Animation

```typescript
type Animation = {
  type: AnimationType      // fade-in, slide-in-left, scale-in, rotate-in 等 14 種
  duration: number         // 秒
  delay: number            // 秒
  easing: string           // CSS easing
  trigger: "onEnter" | "onExit" | "onClick"
  stepIndex: number        // Fragment 制御 (0 = 常に表示)
}
```

同じ `stepIndex` を持つ要素はプレゼンテーション中に同時に出現する（Fragment / ステップ表示）。

### Background

3 種類の判別共用体:

- **単色**: `{ type: "color", value: "#1e293b" }`
- **画像**: `{ type: "image", src: "...", fit: "cover" | "contain" | "fill" }`
- **グラデーション**: `{ type: "gradient", gradient: { kind: "linear" | "radial", angle, stops } }`

### バリデーション

`parsePresentation(data)` で任意の JSON を Zod スキーマで検証し、型安全な `Presentation` を返す。

---

## `@slidini/renderer`

React コンポーネントとしてスライドを描画するライブラリ。Tailwind に依存せずインラインスタイルで完結しており、将来的に npm パッケージとして切り出せる設計。

### コンポーネント階層

```
Presentation          # ビューポートスケーリング, キーボード操作, オートプレイ
└── AnimatePresence   # スライド間トランジション
    └── Slide         # 背景描画 + 要素レンダリング
        └── SlideElement   # type による振り分け + edit モードでのドラッグ/リサイズ
            ├── TextElement   # react-markdown + remark-gfm
            ├── ImageElement  # <img> + object-fit
            └── VideoElement  # <video> + controls
```

### Presentation コンポーネント Props

```typescript
type PresentationProps = {
  data: Presentation
  currentSlide: number
  currentStep: number
  viewMode: "single" | "overview" | "autoplay"
  mode: "edit" | "view"
  autoplayConfig?: AutoplayConfig
  selectedElementId?: string | null
  onSlideChange?: (index: number) => void
  onStepChange?: (step: number) => void
  onElementSelect?: (elementId: string | null) => void
  onElementUpdate?: (elementId: string, updates: ...) => void
}
```

### 表示モード

| モード | 説明 |
|--------|------|
| `single` | 1 スライドずつ表示。CSS `transform: scale()` でビューポートにフィット |
| `overview` | 全スライドをグリッド表示。クリックでスライド選択 |
| `autoplay` | 設定間隔 (秒) で自動進行。キー/クリックで一時停止、再開ボタンで復帰 |

### edit / view モード

| モード | 挙動 |
|--------|------|
| `view` | キーボード操作 (←→, Space) でスライド遷移・Fragment ステップ進行 |
| `edit` | 要素クリックで選択、ドラッグで移動、ハンドルでリサイズ、選択枠を表示 |

### スケーリング

スライドは常にネイティブサイズ (例: 1920×1080) で描画し、`ResizeObserver` + CSS `transform: scale()` でコンテナに収まるようスケーリングする。ドラッグ操作はスケール値で補正されるため、拡大縮小状態でも正しく動作する。

---

## `@slidini/app`

Zustand でステートを管理するスライドエディタ UI。

### 画面構成

```
┌─────────────────────────────────────────────────────────┐
│ Toolbar (要素追加, インポート/エクスポート, 表示モード)        │
├──────┬───────────────────────────────────┬──────────────┤
│      │                                   │              │
│ Slide│         Canvas                    │  Property    │
│ List │    (Presentation in edit mode)    │  Panel       │
│      │                                   │              │
│      │                                   │              │
├──────┴───────────────────────────────────┴──────────────┤
```

### 状態管理 (Zustand)

```typescript
type PresentationStore = {
  presentation: Presentation      // プレゼンテーションデータ
  currentSlideIndex: number       // 現在のスライド
  currentStep: number             // Fragment ステップ
  selectedElementId: string|null  // 選択中の要素
  viewMode: ViewMode              // single | overview | autoplay
  autoplayConfig: AutoplayConfig  // 間隔・ループ設定
  autoplayState: AutoplayState    // running | paused | stopped

  // スライド操作
  addSlide, removeSlide, reorderSlides,
  updateSlideBackground, updateSlideTransition

  // 要素操作
  addElement, updateElement, removeElement

  // JSON 入出力
  exportJson(): string
  importJson(json: string): boolean  // Zod バリデーション付き
}
```

### キーボードショートカット

| キー | 動作 |
|------|------|
| `Delete` / `Backspace` | 選択中の要素を削除 (入力フィールドにフォーカスがあるときは無視) |
| `←` / `→` / `Space` | プレゼンテーションモードでスライド/ステップ遷移 |

### ファイル操作

- **エクスポート**: `Presentation` オブジェクトを `.slide.json` としてダウンロード
- **インポート**: `.json` ファイルを読み込み、Zod でバリデーション後にストアを更新
- **画像 / 動画**: ファイル選択 → Base64 data URI に変換して JSON 内に埋め込み

---

## JSON フォーマット例

```json
{
  "meta": {
    "schemaVersion": 1,
    "title": "サンプルプレゼンテーション",
    "width": 1920,
    "height": 1080,
    "createdAt": "2026-02-26T00:00:00.000Z",
    "updatedAt": "2026-02-26T00:00:00.000Z"
  },
  "slides": [
    {
      "id": "slide-1",
      "background": { "type": "color", "value": "#1e293b" },
      "transition": { "type": "fade", "duration": 0.5, "easing": "ease-out" },
      "elements": [
        {
          "type": "text",
          "id": "text-1",
          "position": { "x": 160, "y": 340 },
          "size": { "width": 1600, "height": 400 },
          "rotation": 0,
          "opacity": 1,
          "zIndex": 1,
          "content": "# Hello World\n\n**Markdown** 対応テキスト",
          "style": {
            "color": "#ffffff",
            "fontSize": 48,
            "fontFamily": "sans-serif",
            "fontWeight": "normal",
            "fontStyle": "normal",
            "textDecoration": "none",
            "textAlign": "center",
            "lineHeight": 1.5,
            "backgroundColor": null,
            "padding": 0
          },
          "animations": [
            {
              "type": "fade-in",
              "duration": 0.8,
              "delay": 0.2,
              "easing": "ease-out",
              "trigger": "onEnter",
              "stepIndex": 0
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 将来構想

- PDF / 画像エクスポート
- テーマ / テンプレート機能
- TipTap 等 WYSIWYG エディタへの移行検討
- フォント管理 (Google Fonts 自動ロード)
- アセットの外部 URL 対応 (`sourceType: "url" | "data"`)
- 大量スライド時の仮想化 (overview)
- スナップ & ガイドライン
- 図形 (Shape) 要素
- Undo / Redo
- renderer からのイベントコールバック拡張
