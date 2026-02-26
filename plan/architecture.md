# スライド作成アプリ 実装プラン

## Context

TypeScript + React + Biome + Bun + Tailwind CSS でスライド作成アプリを新規構築する。
将来的にスライドレンダリング部分をライブラリとして切り出すことを見据え、モノレポ構成でコア・レンダラー・アプリを分離する。
MCPサーバーによるAI連携、テンプレート・カラーセットによるデザイン支援機能を備える。

---

## 要件一覧

| # | 要件 | 実現方法 |
|---|------|----------|
| 1 | スライドサイズ指定（デフォルト1920x1080） | `PresentationMeta.width/height` + CSS transform scale |
| 2 | JSON形式でデータ保持・復元 | Presentation型がJSON互換、Zodでバリデーション |
| 3 | Markdown形式テキスト+装飾 | react-markdown + remark-gfm |
| 4 | 画像埋め込み・背景指定 | ImageElement + Slide.background |
| 5 | 動画埋め込み | VideoElement (`<video>` タグ) |
| 6 | アニメーション（フェード・スライド・回転等） | Framer Motion variants |
| 7 | 表示位置・サイズ変更 | position(x,y) + size(width,height) 絶対配置 |
| 8 | テキスト色変更 | TextStyle.color |
| 9 | 背景変更（色・画像・グラデーション） | Background ユニオン型 (color / image / gradient) |
| 10 | スライド間トランジション | Framer Motion AnimatePresence + Slide.transition |
| 11 | スライドテンプレート | `@slidini/templates` パッケージでJSONテンプレート管理 |
| 12 | カラーセット | プレゼン全体・個別スライドへの配色テーマ適用 |
| 13 | MCP連携 | MCPサーバーによるスライドファイルの読み書き・AI操作 |

---

## プロジェクト構成（Bun workspace モノレポ）

```
slidini/
├── package.json                # ワークスペースルート
├── biome.json
├── tsconfig.json               # ベース tsconfig
├── plan/                       # 設計ドキュメント
│   └── architecture.md
│
├── packages/
│   ├── core/                   # フレームワーク非依存の型・データモデル
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts            # 再エクスポート
│   │       ├── types.ts            # 全型定義（ColorSet含む）
│   │       ├── schema.ts           # Zod バリデーションスキーマ
│   │       ├── animations.ts       # アニメーション定義・プリセット
│   │       └── defaults.ts         # デフォルト値生成関数・DEFAULT_COLOR_SET_COLORS
│   │
│   ├── renderer/               # React スライドレンダラー（将来ライブラリ化対象）
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── components/
│   │       │   ├── Presentation.tsx     # ルート: ビューポート管理・スケーリング
│   │       │   ├── Slide.tsx            # 1枚のスライド: 背景+要素描画
│   │       │   ├── SlideElement.tsx     # 要素タイプ振り分け+ドラッグ移動/リサイズ
│   │       │   ├── TextElement.tsx      # Markdownテキスト描画
│   │       │   ├── ImageElement.tsx     # 画像描画
│   │       │   └── VideoElement.tsx     # 動画描画
│   │       └── hooks/
│   │           ├── useAnimation.ts      # Animation型 → Framer Motion props 変換
│   │           └── useSlideTransition.ts # スライド間トランジション制御
│   │
│   ├── templates/              # スライドテンプレート・カラーセット
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts            # テンプレート・カラーセットのエクスポート
│   │       ├── types.ts            # SlideTemplate型定義（colorRole含む）
│   │       ├── color-sets.ts       # カラーセット管理・色置換ユーティリティ
│   │       └── data/
│   │           ├── title.json           # タイトル
│   │           ├── title-subtitle.json  # タイトル+サブタイトル
│   │           ├── section-divider.json # セクション区切り
│   │           ├── blank.json           # 空白
│   │           ├── title-body.json      # タイトル+本文
│   │           ├── two-column.json      # 2カラム
│   │           ├── quote.json           # 引用
│   │           ├── comparison.json      # 比較
│   │           ├── image-caption.json   # 画像+キャプション
│   │           ├── full-image.json      # 全面画像
│   │           └── color-sets/
│   │               ├── dark-slate.json      # ダークスレート（デフォルト）
│   │               ├── light-clean.json     # ライトクリーン
│   │               ├── midnight-blue.json   # ミッドナイトブルー
│   │               ├── warm-sunset.json     # ウォームサンセット
│   │               ├── forest-green.json    # フォレストグリーン
│   │               └── monochrome.json      # モノクロ
│   │
│   ├── app/                    # スライド編集アプリ（Vite + React）
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── index.css               # Tailwind directives
│   │       ├── store/
│   │       │   └── presentation.ts     # Zustand ストア
│   │       ├── components/
│   │       │   ├── Editor.tsx           # エディタ全体レイアウト
│   │       │   ├── SlideList.tsx        # スライド一覧サイドバー
│   │       │   ├── Canvas.tsx           # スライド編集キャンバス
│   │       │   ├── PropertyPanel.tsx    # プロパティ編集パネル
│   │       │   ├── Toolbar.tsx          # ツールバー（要素追加等）
│   │       │   ├── TemplatePicker.tsx   # テンプレート選択モーダル
│   │       │   └── ColorSetPicker.tsx   # カラーセット選択モーダル
│   │       └── utils/
│   │           └── file.ts             # JSON import/export ユーティリティ
│   │
│   └── mcp/                    # MCP サーバー（AI連携）
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           └── index.ts            # MCPツール定義・サーバー起動
```

---

## パッケージ依存関係

```
core (型・スキーマ・デフォルト)
 ├── renderer (React描画コンポーネント)
 ├── templates (テンプレートJSON・カラーセット)
 │    ├── app (エディタUI)
 │    └── mcp (MCPサーバー)
 └── mcp
```

- `core` は他パッケージに依存しない
- `renderer` は `core` に依存
- `templates` は `core` に依存
- `app` は `core`, `renderer`, `templates` に依存
- `mcp` は `core`, `templates` に依存

---

## 型定義 (`packages/core/src/types.ts`)

```typescript
// ===== プレゼンテーション =====

export type Presentation = {
  meta: PresentationMeta
  slides: Slide[]
}

export type PresentationMeta = {
  schemaVersion: number
  title: string
  width: number   // default: 1920
  height: number  // default: 1080
  createdAt: string   // ISO 8601
  updatedAt: string   // ISO 8601
  colorSetId?: string | null  // 適用中のカラーセットID
}

// ===== スライド =====

export type Slide = {
  id: string
  background: Background
  transition: SlideTransition
  elements: SlideElement[]
  colorSetId?: string | null  // スライド個別のカラーセット上書き
}

export type Background =
  | { type: "color"; value: string }
  | { type: "image"; src: string; fit: "cover" | "contain" | "fill" }
  | { type: "gradient"; gradient: Gradient }

export type Gradient = {
  kind: "linear" | "radial"
  angle: number          // linear のみ (degrees)
  stops: GradientStop[]
}

export type GradientStop = {
  color: string
  position: number       // 0-100 (%)
}

// ===== スライド間トランジション =====

export type SlideTransition = {
  type: SlideTransitionType
  duration: number       // seconds
  easing: string
}

export type SlideTransitionType =
  | "none" | "fade" | "slide-left" | "slide-right"
  | "slide-up" | "slide-down" | "zoom"

// ===== 要素 =====

export type SlideElement = TextElement | ImageElement | VideoElement

export type BaseElement = {
  id: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  rotation: number       // degrees
  opacity: number        // 0-1
  zIndex: number
  animations: Animation[]
}

export type TextElement = BaseElement & {
  type: "text"
  content: string        // Markdown 形式
  style: TextStyle
}

export type TextStyle = {
  color: string
  fontSize: number
  fontFamily: string
  fontWeight: "normal" | "bold"
  fontStyle: "normal" | "italic"
  textDecoration: "none" | "underline" | "line-through"
  textAlign: "left" | "center" | "right"
  lineHeight: number
  backgroundColor: string | null
  padding: number
}

export type ImageElement = BaseElement & {
  type: "image"
  src: string            // URL or data URI (Base64)
  fit: "cover" | "contain" | "fill"
}

export type VideoElement = BaseElement & {
  type: "video"
  src: string            // URL or data URI (Base64)
  autoplay: boolean
  loop: boolean
  muted: boolean
}

// ===== 要素アニメーション =====

export type Animation = {
  type: AnimationType
  duration: number       // seconds
  delay: number          // seconds
  easing: string         // CSS easing function
  trigger: "onEnter" | "onExit" | "onClick"
  stepIndex: number      // Fragment: 同じstepIndexの要素が同時に表示 (0 = 常に表示)
}

export type AnimationType =
  | "fade-in" | "fade-out"
  | "slide-in-left" | "slide-in-right" | "slide-in-top" | "slide-in-bottom"
  | "slide-out-left" | "slide-out-right" | "slide-out-top" | "slide-out-bottom"
  | "rotate-in" | "rotate-out"
  | "scale-in" | "scale-out"

// ===== カラーセット =====

export type ColorSetColors = {
  background: string         // スライド背景色
  surface: string            // カード・ボックス等の表面色
  textPrimary: string        // メインテキスト色
  textSecondary: string      // サブテキスト色
  textMuted: string          // 薄い補助テキスト色
  accent: string             // アクセントカラー
  accentSecondary: string    // セカンダリアクセント
}

export type ColorSet = {
  id: string
  name: string
  colors: ColorSetColors
}

// ===== 表示モード =====

export type ViewMode = "single" | "overview" | "autoplay"

export type AutoplayConfig = {
  interval: number       // seconds
  loop: boolean
}

export type AutoplayState = "running" | "paused" | "stopped"
```

---

## テンプレートシステム (`@slidini/templates`)

### テンプレート型

```typescript
// テンプレート要素（idなし + セマンティックカラーロール）
export type SlideTemplateElement = Omit<SlideElement, "id"> & {
  colorRole?: keyof ColorSetColors     // → style.color にマッピング
  bgColorRole?: keyof ColorSetColors   // → style.backgroundColor にマッピング
}

export type SlideTemplate = {
  id: string
  name: string
  description: string
  category: "basic" | "content" | "media"
  backgroundColorRole?: keyof ColorSetColors  // → slide.background にマッピング
  slide: SlideTemplateData
}
```

### テンプレート一覧

| カテゴリ | テンプレート | 内容 |
|---------|------------|------|
| basic | タイトル | 中央タイトル (72px bold center) |
| basic | タイトル+サブタイトル | タイトル + グレーサブタイトル |
| basic | セクション区切り | グラデーション背景 + セクション名 |
| basic | 空白 | デフォルト背景のみ |
| content | タイトル+本文 | 上部タイトル + 箇条書き本文 |
| content | 2カラム | タイトル + 左右テキストエリア |
| content | 引用 | 引用テキスト (italic) + 出典 |
| content | 比較 | 色分けヘッダー付き2カラム比較 |
| media | 画像+キャプション | 画像プレースホルダー + キャプション |
| media | 全面画像 | 全面画像 (opacity 0.6) + オーバーレイ |

### カラーセット

| ID | 名前 | 概要 |
|----|------|------|
| dark-slate | ダークスレート | 暗い青灰色背景・白テキスト（デフォルト） |
| light-clean | ライトクリーン | 白背景・暗いテキスト |
| midnight-blue | ミッドナイトブルー | 深いネイビー・クールな青系 |
| warm-sunset | ウォームサンセット | 暖色系・オレンジ/アンバーアクセント |
| forest-green | フォレストグリーン | 深緑背景・グリーンアクセント |
| monochrome | モノクロ | 純粋な黒/白/グレー |

### カラーセット適用方式

**即時反映方式** を採用。カラーセット適用時に全スライドの色を実際に置換する。

- `meta.colorSetId` で現在のカラーセットを記録
- `slide.colorSetId` で個別スライドのカラーセット上書きを記録
- 適用時: 旧カラーセットの色 → 新カラーセットの色にマッピング置換
- テンプレートからの新規スライド作成時: `colorRole` によるセマンティックマッピング

```
色解決の優先順位:
1. 手動変更された色（マッピングに一致しないためそのまま残る）
2. カラーセットの色（旧→新でマッピング置換される）
```

---

## 状態管理 (Zustand)

```typescript
type PresentationStore = {
  // データ
  presentation: Presentation

  // 選択状態
  currentSlideIndex: number
  currentStep: number
  selectedElementId: string | null

  // 表示モード
  viewMode: ViewMode
  autoplayConfig: AutoplayConfig
  autoplayState: AutoplayState

  // テンプレートピッカー
  isTemplatePickerOpen: boolean
  openTemplatePicker: () => void
  closeTemplatePicker: () => void
  addSlideFromTemplate: (templateId: string) => void

  // カラーセットピッカー
  isColorSetPickerOpen: boolean
  openColorSetPicker: () => void
  closeColorSetPicker: () => void
  applyColorSet: (colorSetId: string) => void
  applySlideColorSet: (slideId: string, colorSetId: string) => void
  clearSlideColorSet: (slideId: string) => void

  // スライド操作
  addSlide: () => void
  removeSlide: (slideId: string) => void
  reorderSlides: (fromIndex: number, toIndex: number) => void
  updateSlideBackground: (slideId: string, background: Background) => void
  updateSlideTransition: (slideId: string, transition: SlideTransition) => void

  // 要素操作
  addElement: (slideId: string, element: SlideElement) => void
  updateElement: (slideId: string, elementId: string, updates: Partial<SlideElement>) => void
  removeElement: (slideId: string, elementId: string) => void

  // メタ操作
  updateMeta: (updates: Partial<Presentation["meta"]>) => void

  // JSON入出力
  exportJson: () => string
  importJson: (json: string) => boolean

  // 通知
  notification: string | null
  setNotification: (message: string | null) => void
}
```

---

## MCP サーバー (`@slidini/mcp`)

`.slide.json` ファイルを直接読み書きするMCPサーバー。

### ツール一覧

| ツール | 概要 | ReadOnly |
|--------|------|----------|
| `slide_create_presentation` | 新規プレゼンテーション作成 | No |
| `slide_read_presentation` | プレゼンテーション読み込み | Yes |
| `slide_list_slides` | スライド一覧 | Yes |
| `slide_add_slide` | 空スライド追加 | No |
| `slide_remove_slide` | スライド削除 | No |
| `slide_add_text_element` | テキスト要素追加 | No |
| `slide_add_image_element` | 画像要素追加 | No |
| `slide_update_element` | 要素プロパティ更新 | No |
| `slide_remove_element` | 要素削除 | No |
| `slide_update_slide_background` | スライド背景変更 | No |
| `slide_update_slide_transition` | トランジション変更 | No |
| `slide_update_meta` | メタデータ更新 | No |
| `slide_reorder_slides` | スライド並び替え | No |
| `slide_add_element_animation` | アニメーション追加 | No |
| `slide_list_templates` | テンプレート一覧 | Yes |
| `slide_add_slide_from_template` | テンプレートからスライド追加 | No |
| `slide_list_color_sets` | カラーセット一覧 | Yes |
| `slide_apply_color_set` | プレゼン全体にカラーセット適用 | No |
| `slide_apply_slide_color_set` | 個別スライドにカラーセット適用 | No |

---

## 技術選定・依存関係

### ルート (devDependencies)

| パッケージ | 用途 |
|-----------|------|
| `typescript` | 型チェック |
| `@biomejs/biome` | Linter / Formatter |

### packages/core

| パッケージ | 用途 |
|-----------|------|
| `zod` | JSON スキーマバリデーション |

### packages/renderer

| パッケージ | 用途 |
|-----------|------|
| `react`, `react-dom` (peer) | UI |
| `framer-motion` | アニメーション + スライドトランジション |
| `react-markdown` | Markdown レンダリング |
| `remark-gfm` | GFM (テーブル、取り消し線等) |

### packages/templates

| パッケージ | 用途 |
|-----------|------|
| `@slidini/core` | 型定義・デフォルト値 |

### packages/app

| パッケージ | 用途 |
|-----------|------|
| `vite` | ビルドツール / 開発サーバー |
| `@vitejs/plugin-react` | React Fast Refresh |
| `tailwindcss` `@tailwindcss/vite` | UIスタイリング |
| `zustand` | 状態管理 |
| `@slidini/core` | 型定義 |
| `@slidini/renderer` | スライド描画 |
| `@slidini/templates` | テンプレート・カラーセット |

### packages/mcp

| パッケージ | 用途 |
|-----------|------|
| `@modelcontextprotocol/sdk` | MCP サーバーフレームワーク |
| `zod` | 入力バリデーション |
| `@slidini/core` | 型定義 |
| `@slidini/templates` | テンプレート・カラーセット |

---

## コンポーネント設計

### renderer パッケージ（ライブラリ化対象）

> Tailwind に依存しない。インラインスタイルと Framer Motion で完結させる。

```
Presentation
├── props: { data, currentSlide, currentStep, viewMode, mode, ... }
├── ビューポートサイズに合わせて CSS transform: scale() で表示
├── Autoplay タイマー制御
├── キーボードナビゲーション (←→, Space)
│
├── Overview モード: グリッドレイアウト
└── Single/Autoplay モード:
    └── AnimatePresence (スライド間トランジション)
        └── Slide
            ├── 背景描画 (color / image / gradient)
            ├── 要素をzIndex順にソート
            └── SlideElement (振り分け + ドラッグ移動/リサイズ)
                ├── TextElement  → react-markdown + inline style + framer-motion
                ├── ImageElement → <img> + inline style + framer-motion
                └── VideoElement → <video> + inline style + framer-motion
```

### app パッケージ（エディタUI）

> Tailwind CSS でスタイリング。

```
App
└── Editor (flex レイアウト)
    ├── Toolbar          # 上部: テキスト/画像/動画追加、カラーセット、プレビュー、JSON入出力
    └── (flex row)
        ├── SlideList        # 左サイドバー: スライドサムネイル一覧 + 「+追加」→テンプレートピッカー
        ├── Canvas           # 中央: 選択中スライドのプレビュー+編集
        │   └── Presentation (renderer パッケージ)
        └── PropertyPanel    # 右サイドバー: スライド/要素プロパティ + カラーセット(個別)
    ├── TemplatePicker   # モーダル: テンプレート選択
    └── ColorSetPicker   # モーダル: カラーセット選択
```

---

## 検証方法

```bash
# 型チェック
bun run --filter '@slidini/*' typecheck

# Lint / Format
npx biome check

# アプリビルド
bun run --filter '@slidini/app' build

# 開発サーバー起動
cd packages/app && bun run dev

# MCP サーバー起動
cd packages/mcp && bun run start
```
