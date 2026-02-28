# @slidini/mcp

`.slide.json` ファイルをLLM（Claude等）から操作するためのMCPサーバー。stdioトランスポートで動作。

## 起動

```bash
bun run packages/mcp/src/index.ts
```

## 設定

プロジェクトルートの `.mcp.json`:

```json
{
  "mcpServers": {
    "slidini": {
      "command": "/Users/<username>/.bun/bin/bun",
      "args": ["run", "packages/mcp/src/index.ts"]
    }
  }
}
```

## ファイル構成

```
src/
  index.ts          # サーバー起動 + ヘルパー関数
  slide-tools.ts    # スライド操作ツール (23 個)
  video-tools.ts    # 動画設定ツール (5 個)
```

## ツール一覧（28 ツール）

### プレゼンテーション管理

| ツール | 説明 |
|--------|------|
| `slide_create_presentation` | 新規 `.slide.json` を作成 |
| `slide_read_presentation` | プレゼンテーションJSON読み込み |
| `slide_list_slides` | スライド一覧（要素数付き） |
| `slide_update_meta` | メタ情報（タイトル、サイズ等）更新 |

### スライド操作

| ツール | 説明 |
|--------|------|
| `slide_add_slide` | 空スライド追加 |
| `slide_remove_slide` | スライド削除 |
| `slide_reorder_slides` | スライド並べ替え |
| `slide_update_slide_background` | 背景変更（色、画像、グラデーション） |
| `slide_update_slide_transition` | トランジション変更 |

### 要素操作

| ツール | 説明 |
|--------|------|
| `slide_add_text_element` | テキスト要素追加 |
| `slide_add_image_element` | 画像要素追加 |
| `slide_add_chart_element` | グラフ要素追加 |
| `slide_update_element` | 要素プロパティ更新 |
| `slide_remove_element` | 要素削除 |
| `slide_add_element_animation` | アニメーション追加 |

### テンプレート・カラーセット

| ツール | 説明 |
|--------|------|
| `slide_list_templates` | テンプレート一覧 |
| `slide_add_slide_from_template` | テンプレートからスライド追加 |
| `slide_list_color_sets` | カラーセット一覧 |
| `slide_apply_color_set` | プレゼン全体にカラーセット適用 |
| `slide_apply_slide_color_set` | 個別スライドにカラーセット適用 |

### オーバーレイ要素

| ツール | 説明 |
|--------|------|
| `slide_add_overlay_element` | 背景/前面オーバーレイ要素追加 |
| `slide_remove_overlay_element` | オーバーレイ要素削除 |
| `slide_update_overlay_element` | オーバーレイ要素更新 |

### 動画設定操作（5 ツール）

| ツール | 説明 |
|--------|------|
| `slide_create_video_config` | 新規 `.video.json` を作成 |
| `slide_read_video_config` | `.video.json` 読み込み |
| `slide_update_video_config` | トップレベル設定を更新 (fps, VOICEVOX 等) |
| `slide_set_slide_narration` | スライドごとのナレーション / 音声ファイルを設定 |
| `slide_set_bgm` | BGM 設定を一括置き換え |

**ルール:**
- `slide_set_slide_narration`: `narration` と `audio_file` は排他（同時指定エラー）
- `slide_set_slide_narration`: 既存の `slideIndex` エントリを上書き、なければ追加
- `slide_set_bgm`: `bgm` 配列を丸ごと置き換え

## 依存関係

- `@slidini/core` — 型定義・バリデーション
- `@slidini/templates` — テンプレート・カラーセット
- `@slidini/video-export` — 動画設定スキーマ
- `@modelcontextprotocol/sdk` — MCPプロトコル
- `zod` — 入力バリデーション
