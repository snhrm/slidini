# CLAUDE.md

このファイルは Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイドラインです。

## コマンド

```bash
bun run dev          # Vite 開発サーバー（app）
bun run build        # プロダクションビルド（app）
bun run typecheck    # 全パッケージの型チェック
bun run check        # Biome lint + format チェック
bun run format       # Biome 自動フォーマット（ファイル書き換え）
bun test             # 全テスト実行（bun test）
```

MCP サーバー: `bun run --filter @slidini/mcp start`

## コード変更時の必須チェック

コードを変更した場合、以下を必ず実行して問題がないことを確認すること:

```bash
bun run check        # Biome lint + format チェック
bun test             # テスト実行
bun run typecheck    # 型チェック
```

lint/format エラーがあれば `bun run format` で自動修正できる。テストや型チェックのエラーは手動で修正すること。

## テスト

- テストランナー: `bun test`（Jest 互換 API）
- React コンポーネントテスト: `@testing-library/react` + `happy-dom`
- テストファイル配置: `packages/<pkg>/src/__tests__/*.test.ts(x)`
- 設定: `bunfig.toml`（happy-dom プリロード）

```bash
bun test                    # 全テスト実行
bun test packages/core      # パッケージ単位で実行
bun test --coverage         # カバレッジ付き実行
```

## アーキテクチャ

Bun ワークスペースモノレポ（6 パッケージ）:

```
app ──> renderer ──> core
 │                    ▲
 ├──> templates ──────┘
 │                    ▲
mcp ──> templates ────┘
 ├──> core
 │
video-export ──> renderer ──> core
```

- **core** (`@slidini/core`): 型定義、Zod スキーマ、デフォルト値。フレームワーク非依存、`zod` のみに依存。`parsePresentation()` でバリデーション、`generateId(prefix)` で ID 生成、`createDefaultSlide()` 等のファクトリ関数をエクスポート。
- **renderer** (`@slidini/renderer`): Framer Motion を使用した React スライドレンダラー。**Tailwind 不使用** — 全てインラインスタイル。将来的にスタンドアロン npm パッケージとして切り出し予定。`ResizeObserver` + CSS `transform: scale()` でビューポートフィッティング。
- **templates** (`@slidini/templates`): 10 種のスライドテンプレート JSON + 6 種のカラーセットプリセット。テンプレートは `colorRole`/`bgColorRole` でセマンティックカラーマッピング。カラーセットは `applyColorSetToSlide()` で hex→hex の即時置換。
- **video-export** (`@slidini/video-export`): スライドから動画（MP4）を生成。Puppeteer + timeweb でフレーム単位キャプチャ。`.video.json` 設定ファイルで FPS、スライドごとのナレーション（VOICEVOX 音声合成）、BGM を管理。
- **app** (`@slidini/app`): Vite + React + Tailwind + Zustand によるエディタ UI。単一の Zustand ストア（`usePresentationStore`）で全状態を管理。
- **mcp** (`@slidini/mcp`): MCP サーバー（stdio トランスポート）。AI による `.slide.json` / `.video.json` ファイル操作用。スライドツール（`slide_*`）と動画設定ツール（`slide_create_video_config` 等）を提供。

## コードスタイル（Biome 強制）

- **タブ**でインデント
- **セミコロンなし**（`semicolons: "asNeeded"`）
- 行幅: 100
- import は Biome が自動整理
- 型のみの import には `import type { ... }` を使用

## 規約

- 全ワークスペースパッケージは `"main": "./src/index.ts"` でソースを直接公開 — パッケージ間 import にビルド不要
- Zustand セレクタは常に `zustand/react/shallow` の `useShallow` を使用
- `noUncheckedIndexedAccess: true` — 配列アクセスは `T | undefined` を返す
- 全ての位置・サイズは絶対ピクセル（デフォルトキャンバス 1920x1080）
- プレゼンテーションデータは `.slide.json` ファイルとして保存、画像・動画は Base64 データ URI で埋め込み
- 動画エクスポート設定は `.video.json` ファイルとして保存（入力元 `.slide.json`、FPS、ナレーション、BGM 等）
- `updatedAt` はミューテーションごとに `new Date().toISOString()` で設定すること
- MCP ツール名は `slide_` プレフィックス + `snake_case`

## データモデル

```
Presentation
├── meta: { schemaVersion: 1, title, width, height, colorSetId?, createdAt, updatedAt }
└── slides: Slide[]
    ├── id, background (color|image|gradient), transition, colorSetId?
    └── elements: (TextElement | ImageElement | VideoElement)[]
        └── 共通: id, position, size, rotation, opacity, zIndex, animations[]

VideoConfig (.video.json)
├── input: 入力 .slide.json ファイル名
├── fps, defaultSlideDuration
├── voicevox: { speaker, speed, pitch, volume }
├── slides: [{ slideIndex, narration?, audioFile?, duration? }]
└── bgm: [{ src, volume?, loop?, fadeIn?, fadeOut? }]
```

テキストコンテンツは Markdown（react-markdown + remark-gfm で描画）。

## 言語

プロジェクトドキュメントと UI テキストは日本語。コード（変数名、コメント）は英語。
