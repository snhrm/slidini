# slidini

TypeScript + React で構築されたスライド作成・プレゼンテーションアプリ。

将来的にレンダラーをライブラリとして切り出すことを見据え、Bun workspace モノレポで 6 パッケージに分離した構成。

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
| 動画エクスポート | Puppeteer + FFmpeg + timeweb |
| 音声合成 | VOICEVOX |
| AI 連携 | MCP (Model Context Protocol) |

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

## パッケージ構成

```
slidini/
├── packages/
│   ├── core/            # 型定義・Zod スキーマ・デフォルト値（フレームワーク非依存）
│   ├── renderer/        # React スライドレンダラー（将来ライブラリ化対象）
│   ├── templates/       # スライドテンプレート・カラーセット
│   ├── app/             # エディタ UI（Vite + React + Tailwind + Zustand）
│   ├── mcp/             # MCP サーバー（AI からの .slide.json / .video.json 操作）
│   └── video-export/    # 動画エクスポート CLI（Puppeteer + FFmpeg）
├── samples/             # サンプルファイル
├── plan/                # 設計ドキュメント
├── biome.json
├── tsconfig.json
└── package.json         # ワークスペースルート
```

## 依存グラフ

```
app ──> renderer ──> core
 │                    ▲
 ├──> templates ──────┘
 │                    ▲
mcp ──> templates ────┘
 └──> core
        ▲
video-export
 └──> core, renderer
```

| パッケージ | 概要 |
|-----------|------|
| [core](packages/core/) | フレームワーク非依存の型定義・Zod スキーマ・ファクトリ関数 |
| [renderer](packages/renderer/) | React + Framer Motion スライドレンダラー（Tailwind 非依存） |
| [templates](packages/templates/) | スライドテンプレート JSON + カラーセットプリセット |
| [app](packages/app/) | Tailwind + Zustand によるエディタ UI |
| [mcp](packages/mcp/) | MCP サーバー (28 ツール) で AI エージェントにスライド操作 API を提供 |
| [video-export](packages/video-export/) | Puppeteer フレームキャプチャ + FFmpeg で MP4 動画生成 |

## `.slide.json` フォーマット例

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

## 将来構想

- PDF / 画像エクスポート
- TipTap 等 WYSIWYG エディタへの移行検討
- アセットの外部 URL 対応 (`sourceType: "url" | "data"`)
- 大量スライド時の仮想化 (overview)
- スナップ & ガイドライン
- 図形 (Shape) 要素
- Undo / Redo
- renderer からのイベントコールバック拡張
