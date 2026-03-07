---
name: slidini-mcp
description: "スライドプレゼンテーションの作成・編集・ナレーション設定を行うスキル。MCP ツール（slide_*）による個別編集と、JSON 一括生成による新規作成の両方に対応。トリガー: 'スライド作成', 'プレゼンを作って', 'ナレーション追加', 'BGM設定', 'make slides', 'create presentation', 'スライドを作って', 'プレゼン作成'"
---

# Slidini スライド作成スキル

プレゼンテーションの新規作成・編集・再生設定を行う統合スキル。

## 概要

2つの作成モードを使い分ける:

1. **一括生成モード**: 完全な `.slide.json` を直接生成（新規プレゼン作成時に使用）
2. **MCP 編集モード**: `mcp__slidini__slide_*` ツールで個別要素を操作（既存プレゼンの編集時に使用）

## 使い方

```
/slidini-mcp コンテンツ.md                          # デフォルトスタイルで一括生成
/slidini-mcp コンテンツ.md --style canva-frame      # Canvaフレームスタイル
/slidini-mcp コンテンツ.md --color-set midnight-blue # カラーセット指定
/slidini-mcp コンテンツ.md --slides 10              # スライド数指定
/slidini-mcp コンテンツ.md --with-images            # Gemini CLI で画像生成
/slidini-mcp                                        # 内容を対話的に入力
```

## オプション

| オプション | 説明 |
|-----------|------|
| `--style <id>` | デッキスタイル: `default`, `canva-frame`, `speakerdeck`（詳細は `references/deck-styles.md`） |
| `--color-set <id>` | カラーセット: `dark-slate`, `light-clean`, `midnight-blue` 等 |
| `--slides <数>` | 目標スライド数（5-25推奨） |
| `--with-images` | Gemini CLI で画像を自動生成 |
| `--image-style <style>` | 画像スタイル: `flat-illustration`（デフォルト）, `watercolor`, `sketch` 等 |
| `--outline-only` | アウトラインのみ生成 |

## デッキスタイル

| ID | 説明 | 特徴 |
|----|------|------|
| `default` | 標準スタイル | グラデーションセクション + ソリッド背景 + アクセントバー |
| `canva-frame` | Canva テンプレ風 | ネイビーボーダーフレーム + 中央タイトル + 区切り線 |
| `speakerdeck` | 登壇スライド風 | 左寄せ大文字タイトル + 余白重視 + 底部プログレスバー |

詳細は `references/deck-styles.md` を参照。

## カラーセット

| ID | 背景色 | 用途 |
|----|--------|------|
| `light-clean` | #ffffff | ビジネス、フォーマル |
| `sakura` | #ffffff | フェミニン、ソフト |
| `ocean-breeze` | #ffffff | フレッシュ、クリーン |
| `lavender` | #ffffff | クリエイティブ、落ち着き |
| `mint` | #ffffff | ナチュラル、ヘルシー |
| `coral` | #ffffff | 活発、エネルギッシュ |
| `sky` | #f0f9ff | 爽やか、テック |
| `slate` | #ffffff | モノトーン、ビジネス |
| `warm-neutral` | #faf8f5 | ウォーム、ナチュラル |
| `dark-slate` | #1e293b | 汎用、テクニカル |
| `midnight-blue` | #0f172a | テック、建築 |
| `warm-sunset` | #1c1917 | クリエイティブ、ストーリー |
| `neon-dark` | #0a0a0a | ゲーム、エンタメ |

### 自動選択ルール

| コンテンツの特徴 | 推奨カラーセット |
|-----------------|----------------|
| ビジネス、企業、提案書 | `light-clean` |
| テクニカル、アーキテクチャ | `midnight-blue` |
| クリエイティブ、ストーリー | `warm-sunset` |
| ミニマル、エグゼクティブ | `slate` |
| デフォルト | `dark-slate` |

### スタイルとカラーセットの組み合わせ

| スタイル | 推奨カラーセット |
|---------|----------------|
| `default` | 全カラーセット対応 |
| `canva-frame` | `midnight-blue`（最適）、カスタムカラーも可 |
| `speakerdeck` | `ocean-breeze`、カスタムカラー推奨 |

## ワークフロー: 一括生成モード

### ステップ1: コンテンツ分析

1. ファイルパスならファイルを読む。内容なければ対話で入力
2. 分析:
   - 核心メッセージとサポートポイント
   - カラーセットとスタイルの自動推奨
   - 言語の検出
   - 推奨スライド数
3. トピックスラグ生成（2-4語、kebab-case）

### ステップ2: 確認

ユーザーの言語で分析結果を表示し確認。**`--style` 未指定の場合は選択肢を提示する:**

```
📐 デッキスタイルを選んでください:

1. default — グラデーションセクション + アクセントバー
2. canva-frame — ネイビーボーダーフレーム + 中央タイトル + 区切り線
3. speakerdeck — 左寄せ大文字タイトル + 余白重視 + 底部プログレスバー

番号またはスタイル名で指定（デフォルト: 1）
```

確認項目:
- デッキスタイル（未指定なら選択肢提示）
- カラーセット（未指定なら自動推奨を提示）
- スライド数
- 画像生成の有無

ユーザーが「おまかせ」「進めて」等と言った場合はデフォルト値を使用。

### ステップ3: アウトライン生成

`references/outline-template.md` に従いアウトライン作成。
`--outline-only` の場合はここで終了。

### ステップ4: JSON 生成

**完全な `.slide.json` を Write ツールで直接書き出す。**MCP ツールは使わない（一括生成の方が圧倒的に速い）。

出力先: `projects/{name}/{name}.slide.json`

生成ルール:
1. 選択したデッキスタイル（`references/deck-styles.md`）に従いスライド構造を構築
2. レイアウトは `references/layouts.md` の座標を使用
3. カラーはカラーセットから適用（`references/design-guidelines.md`）
4. コンテンツは `references/content-rules.md` に従う
5. ID は `{type}-{timestamp}-{random6}` 形式

### ステップ5: 画像生成（`--with-images` 時のみ）

`references/image-generation.md` を参照。Gemini CLI で画像を生成し、JSON に埋め込む。

### ステップ6: 出力

サマリーを表示:
```
スライド作成完了！

トピック: [topic]
スタイル: [style]
カラーセット: [name]
ファイル: [path]
スライド数: N枚

1. カバー — [title]
2. [slide title]
...
N. クロージング — [message]
```

## ワークフロー: MCP 編集モード

既存プレゼンの修正には MCP ツールを使用。

### 利用可能な MCP ツール

#### プレゼンテーション管理
| ツール | 用途 |
|--------|------|
| `slide_create_presentation` | 新規プロジェクト作成 |
| `slide_read_presentation` | プレゼン全体を読む |
| `slide_list_slides` | スライド一覧取得 |
| `slide_update_meta` | タイトル・サイズ変更 |

#### スライド操作
| ツール | 用途 |
|--------|------|
| `slide_add_slide` | 空白スライド追加 |
| `slide_add_slide_from_template` | テンプレートからスライド追加 |
| `slide_remove_slide` | スライド削除 |
| `slide_reorder_slides` | スライド順序変更 |
| `slide_update_slide_background` | 背景変更（単色/グラデーション/画像） |
| `slide_update_slide_transition` | トランジション変更 |

#### 要素操作
| ツール | 用途 |
|--------|------|
| `slide_add_text_element` | テキスト要素追加（Markdown対応） |
| `slide_add_image_element` | 画像要素追加 |
| `slide_add_chart_element` | チャート追加（棒/折線/円/ドーナツ/エリア/レーダー） |
| `slide_update_element` | 要素プロパティ更新 |
| `slide_remove_element` | 要素削除 |
| `slide_add_element_animation` | アニメーション追加 |

#### オーバーレイ
| ツール | 用途 |
|--------|------|
| `slide_add_overlay_element` | 常時表示オーバーレイ追加 |
| `slide_update_overlay_element` | オーバーレイ更新 |
| `slide_remove_overlay_element` | オーバーレイ削除 |

#### カラー・テンプレート
| ツール | 用途 |
|--------|------|
| `slide_list_templates` | テンプレート一覧 |
| `slide_list_color_sets` | カラーセット一覧 |
| `slide_apply_color_set` | カラーセット適用（全体） |
| `slide_apply_slide_color_set` | カラーセット適用（単一スライド） |

#### 再生・動画設定
| ツール | 用途 |
|--------|------|
| `slide_create_video_config` | 再生設定初期化 |
| `slide_read_video_config` | 再生設定読み込み |
| `slide_update_video_config` | デフォルト値更新 |
| `slide_set_slide_narration` | スライドごとのナレーション設定 |
| `slide_set_bgm` | BGM設定 |

## コンテンツ密度ルール

**1スライド = 150〜350文字**（ナレーション30〜60秒分）

| 要素 | 制限 |
|------|------|
| 箇条書き | **最大4項目**（超える場合はスライド分割） |
| コードブロック | 最大8行（長い場合は要点のみ抽出） |
| タイトル | 要素幅に収まること |

**分割基準:**
- 箇条書き5つ以上 → 2スライドに分割
- 本文350文字以上 → 2スライドに分割
- before/after → two-column レイアウトで1スライド

## キャンバス・レイアウト

キャンバス: **1920 x 1080** px。マージン: 水平100px、垂直50px。

### レイアウトパターン

| レイアウト | 用途 |
|-----------|------|
| `title-hero` | カバースライド |
| `title-body` | 一般コンテンツ |
| `two-column` | 2カラム比較 |
| `comparison` | 色分け比較（長所/短所） |
| `section-divider` | セクション区切り |
| `quote` | 引用 |
| `key-stat` | 数値インパクト |
| `three-point` | 3ポイント要約 |
| `image-text` | 画像+テキスト |
| `closing` | クロージング |

詳細座標は `references/layouts.md` を参照。

### フォントサイズガイド

| 要素 | fontSize |
|------|----------|
| カバータイトル | 72-80 |
| セクションタイトル | 64-72 |
| スライドタイトル | 42-52 |
| サブタイトル | 28-40 |
| 本文 | 34-36 |
| 箇条書き | 32-36 |
| コードブロック | 24-32 |
| キャプション | 22-28 |
| 統計数値 | 120-180 |

### 余白を埋めるレイアウト調整

**スライド下部に余白が生じないよう、要素を y:1050 付近まで伸ばす。**

- カードグリッドは**下端が y:1020〜1050** に届くようにカードの height を拡大する
- フォントサイズも合わせて大きくする（カード内 28→32-36、本文 30→34）
- 白カード（`backgroundColor: "#ffffff"` + `padding: 36-44`）を使うと、テキスト量が少なくても余白が視覚的に埋まる
- 補足テキスト（note）はカードの下に配置し、y:800〜830 付近に下げる
- **余白が埋められない場合**: 文章を中央寄せにする、白カードで領域を確保する、装飾要素（区切り線、アクセントバー）を追加する

### 要素高さ計算ルール

**フォントサイズを変更したら高さも必ず調整:**
```
height = 行数 × fontSize × lineHeight + padding × 2 + 10
```

## トランジション

| コンテキスト | タイプ | 所要時間 |
|-------------|--------|---------|
| デフォルト | `fade` | 0.5s |
| コンテンツ間 | `slide-left` | 0.4s |
| セクション切替 | `fade` | 0.3s |
| 強調 | `zoom` | 0.4s |

## アニメーション

```json
{ "type": "fade-in", "duration": 0.3-0.5, "delay": 0.1-0.3, "easing": "ease-out", "trigger": "onEnter", "stepIndex": 0 }
```

- カバータイトル: fade-in, delay:0.1
- カバーサブタイトル: fade-in, delay:0.4
- 統計数値: scale-in, delay:0.1
- 要約カード: slide-in-bottom, staggered delay 0.2/0.35/0.5

## ナレーション（VOICEVOX）

ナレーションはすべて日本語。英語の技術用語はカタカナに変換。

### カタカナ変換表

| 英語 | カタカナ |
|------|---------|
| React | リアクト |
| JavaScript | ジャバスクリプト |
| TypeScript | タイプスクリプト |
| API | エーピーアイ |
| CSS | シーエスエス |
| HTML | エイチティーエムエル |
| GitHub | ギットハブ |
| npm | エヌピーエム |
| CLI | シーエルアイ |
| UI | ユーアイ |
| JSON | ジェイソン |
| MCP | エムシーピー |
| SDK | エスディーケー |
| VS Code | ブイエスコード |
| Slack | スラック |
| CI/CD | シーアイシーディー |

アルファベットのまま残さないこと。

### ナレーション品質ルール

1. **画面を補完する** — スライドの丸読みではなく、背景や意義を補足
2. **自然な話し言葉** — 箇条書きを流暢な文章に変換
3. **コードは説明に変換** — 読み上げず「このコマンドを実行すると〜」
4. **1スライド30〜60秒**
5. **技術用語は初出時に説明** — 「エムシーピー、モデルコンテキストプロトコルの〜」

## JSON 生成ガイドライン

### スライド背景パターン

**単色**（コンテンツスライド）:
```json
{ "type": "color", "value": "[colors.background]" }
```

**グラデーション**（カバー、セクション区切り）:
```json
{
  "type": "gradient",
  "gradient": {
    "kind": "linear", "angle": 135,
    "stops": [
      { "color": "[colors.accent]", "position": 0 },
      { "color": "[colors.accentSecondary]", "position": 100 }
    ]
  }
}
```

### テキスト要素パターン

```json
{
  "type": "text",
  "id": "[一意のID]",
  "position": { "x": 100, "y": 50 },
  "size": { "width": 1720, "height": 140 },
  "rotation": 0, "opacity": 1, "zIndex": 1,
  "content": "## Markdownコンテンツ",
  "style": {
    "color": "#hex", "fontSize": 52,
    "fontFamily": "Noto Sans JP",
    "fontWeight": "bold", "fontStyle": "normal",
    "textDecoration": "none", "textAlign": "left",
    "lineHeight": 1.3,
    "backgroundColor": null, "padding": 0
  },
  "animations": []
}
```

### デザインアクセント

**アクセントバー（default スタイル）:**
- 左端縦バー: width:4, height:1080, x:0
- 上端横バー: width:1920, height:4, y:0
- 下端横バー: width:1920, height:6-10, y:1070

**バッジ/タグ:**
```
fontSize: 22-26, backgroundColor: accent, color: background, padding: 12-14
```

## 重要な注意事項

- `slide_create_presentation` は `projects/{name}/{name}.slide.json` を作成
- 一括生成時は Write ツールで直接 JSON を書き出す（MCP ツールより高速）
- グラデーション stops は `position`（0-100）を使用、`offset` ではない
- `file_path` は**絶対パス**を使用
- `updatedAt` は MCP サーバーが自動設定
- テキストコンテンツは Markdown（react-markdown でレンダリング）
- **フォントサイズ変更時は height も必ず調整**

## リファレンス

| ファイル | 内容 |
|---------|------|
| `references/deck-styles.md` | デッキスタイル定義（default, canva-frame, speakerdeck） |
| `references/layouts.md` | レイアウトパターンの座標 |
| `references/content-rules.md` | コンテンツ・スタイルルール |
| `references/outline-template.md` | アウトラインテンプレート |
| `references/design-guidelines.md` | デザインガイドライン（ビジュアル階層・原則） |
| `references/presentation-advice.md` | 登壇資料デザインの極意（コンテンツ・デザイン原則） |
| `references/image-generation.md` | Gemini CLI による画像生成 |
