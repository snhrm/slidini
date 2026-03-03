---
name: slidini-mcp
description: "Create and edit slide presentations and video/playback configs using the slidini MCP server tools (slide_* prefix). Use when the user asks to create slides via MCP, build a presentation, add narration, set BGM, or configure playback. Trigger phrases: 'MCPでスライド作成', 'プレゼンを作って', 'ナレーション追加', 'BGM設定', 'make slides with MCP', 'create presentation'."
---

# Slidini MCP Skill

Create and edit slide presentations and playback/video configs via the slidini MCP server tools.

## Overview

This skill uses the `mcp__slidini__slide_*` MCP tools to create, read, and modify `.slide.json` presentation files. All files are stored under the `projects/` directory.

**Two capabilities:**
1. **Slide creation** — Build complete presentations with text, images, charts, animations, transitions, and color sets
2. **Playback config** — Add narration (VOICEVOX TTS), BGM, and per-slide duration settings

## Prerequisites

The slidini MCP server must be running. It is configured in `.mcp.json` at the project root.

## Available MCP Tools

### Presentation Lifecycle
| Tool | Purpose |
|------|---------|
| `slide_create_presentation` | Create new project (`projects/{name}/{name}.slide.json`) |
| `slide_read_presentation` | Read full presentation JSON |
| `slide_list_slides` | List slides with IDs and element counts |

### Slide Management
| Tool | Purpose |
|------|---------|
| `slide_add_slide` | Add blank slide at position |
| `slide_add_slide_from_template` | Add slide from template (use `slide_list_templates` first) |
| `slide_remove_slide` | Remove slide by ID |
| `slide_reorder_slides` | Move slide from one index to another |
| `slide_update_slide_background` | Set background (color / gradient / image) |
| `slide_update_slide_transition` | Set transition type, duration, easing |

### Element Management
| Tool | Purpose |
|------|---------|
| `slide_add_text_element` | Add text element with Markdown content |
| `slide_add_image_element` | Add image element |
| `slide_add_chart_element` | Add chart (bar, line, pie, etc.) |
| `slide_update_element` | Update any element property |
| `slide_remove_element` | Remove element from slide |
| `slide_add_element_animation` | Add animation to element |

### Overlay Elements
| Tool | Purpose |
|------|---------|
| `slide_add_overlay_element` | Add persistent overlay (background/foreground layer) |
| `slide_remove_overlay_element` | Remove overlay element |
| `slide_update_overlay_element` | Update overlay element |

### Color & Templates
| Tool | Purpose |
|------|---------|
| `slide_list_templates` | List available slide templates |
| `slide_list_color_sets` | List available color set presets |
| `slide_apply_color_set` | Apply color set to entire presentation |
| `slide_apply_slide_color_set` | Apply color set to single slide |

### Meta
| Tool | Purpose |
|------|---------|
| `slide_update_meta` | Update title, dimensions, etc. |

### Playback / Video Config
| Tool | Purpose |
|------|---------|
| `slide_create_video_config` | Initialize playback config |
| `slide_read_video_config` | Read current playback config |
| `slide_update_video_config` | Update default durations |
| `slide_set_slide_narration` | Set narration text or audio per slide |
| `slide_set_bgm` | Set BGM array (src, volume, loop, fade) |

## Content Density Rules

**1スライド = 150〜350文字**（ナレーション30〜60秒分）

| 要素 | 制限 |
|------|------|
| 箇条書き | **最大4項目**（超える場合はスライドを分割） |
| コードブロック | 最大8行（長い場合は要点のみ抽出） |
| タイトル | 要素幅に収まること（長い場合はフォントサイズを下げる） |

**スライド分割の目安:**
- 箇条書き5つ以上 → 2スライドに分割
- 本文350文字以上 → 2スライドに分割
- before/after を含む → two-column レイアウトで1スライド

## Workflow

### Creating a Presentation

```
1. Analyze user's content / topic
2. Determine color set and slide count
3. slide_create_presentation (name, title)
4. slide_apply_color_set (choose appropriate theme)
5. For each slide:
   a. slide_add_slide or slide_add_slide_from_template
   b. slide_add_text_element (title)
   c. slide_add_text_element (body content)
   d. slide_update_slide_background (gradient for covers/dividers)
   e. slide_update_slide_transition
   f. slide_add_element_animation (for key elements)
6. Remove the default first slide if unused
7. Report summary to user
```

### Adding Narration

```
1. slide_create_video_config (set defaults)
2. For each slide:
   slide_set_slide_narration (slide_index, narration text)
3. Optionally: slide_set_bgm
```

## Canvas & Layout Reference

Canvas: **1920 x 1080** px. Margins: 80px horizontal, 30px vertical.

### Layout Patterns

**title-hero** (cover slides):
```
Title:    x:100  y:300  w:1720 h:280  fontSize:72-80  bold  left/center
Subtitle: x:100  y:600  w:1720 h:120  fontSize:28-36  normal left/center
Background: gradient or solid dark
```

**title-body** (most content slides):
```
Title: x:80  y:30   w:1760 h:80   fontSize:42-48  bold  left
Body:  x:80  y:130  w:1760 h:920  fontSize:32-36  normal left  lineHeight:1.5-1.6
Background: solid color
```

**two-column**:
```
Title:     x:80   y:30   w:1760 h:80   fontSize:42-48 bold left
Left col:  x:80   y:130  w:880  h:920  fontSize:28-32 normal left
Right col: x:980  y:130  w:860  h:920  fontSize:28-32 normal left
```

**section-divider**:
```
Section: x:100 y:400  w:1720 h:100  fontSize:64-72  bold left
Version: x:100 y:520  w:400  h:44   fontSize:22-26  normal left
Background: solid dark + accent line
```

**key-stat**:
```
Number:  x:80  y:200  w:1760 h:300  fontSize:160-180 bold center
Label:   x:80  y:520  w:1760 h:80   fontSize:36  bold center
Context: x:200 y:640  w:1520 h:200  fontSize:28-32  normal center
```

**three-point** (summary):
```
Title:   x:80   y:30   w:1760 h:80   fontSize:46  bold left
Block 1: x:60   y:150  w:580  h:500  fontSize:28-34  normal left  padding:28
Block 2: x:670  y:150  w:580  h:500  fontSize:28-34  normal left  padding:28
Block 3: x:1280 y:150  w:580  h:500  fontSize:28-34  normal left  padding:28
```

**closing**:
```
Message: x:80  y:300  w:1760 h:200  fontSize:48-52 bold left
Subtext: x:80  y:560  w:900  h:52   fontSize:24-26 bold left  bgColor:accent
```

### Font Size Guide

| Element | fontSize |
|---------|----------|
| Cover title | 72-80 |
| Section title | 64-72 |
| Slide title | 42-48 |
| Subtitle | 28-36 |
| Body text | 32-36 |
| Bullets | 28-34 |
| Code blocks | 26-32 |
| Caption | 22-28 |
| Key stat number | 160-180 |

### Element Sizing Rule

**フォントサイズを上げたら高さも合わせる:**
- title（1行）: height = fontSize × 1.5 + 10
- body（複数行）: height = 行数 × fontSize × lineHeight + 20
- 要素の下端が canvas (1080px) を超えないこと

## Color Sets

| ID | Background | Best For |
|----|------------|----------|
| `dark-slate` | #1e293b | General, technical |
| `light-clean` | #ffffff | Business, formal |
| `sakura` | #fdf2f8 | Feminine, soft |
| `ocean-breeze` | #ecfeff | Fresh, clean |
| `lavender` | #faf5ff | Calm, creative |
| `mint` | #f0fdf4 | Natural, healthy |
| `midnight-blue` | #0f172a | Tech, architecture |
| `warm-sunset` | #1c1917 | Creative, storytelling |
| `forest-green` | #052e16 | Nature, sustainability |
| `monochrome` | #18181b | Minimal, executive |

### カスタムテーマ（colorSetId: null）

テーマを直接指定する場合の推奨カラーパレット:

**ターミナル風（Claude Code系）:**
- background: `#0c0c0c` / surface: `#111111`
- text: `#d4d4d8` / accent: `#f97316`（オレンジ）
- font: `BIZ UDPGothic`

## Content Rules

### スライドコンテンツ
- 1スライド = 1メッセージ
- 見出しはストーリーを語る（「主要機能」ではなく「スマホからClaude Codeを操作可能に」）
- AI クリシェ禁止: 「dive into」「explore」「journey」「leverage」
- **最大4箇条書き**（超えたらスライドを分割）
- Markdown: `#` for titles, `-` for bullets, `**bold**` for emphasis
- 意味のあるクロージング（「ありがとう」だけでなく次のアクション）

### テキスト改行ルール
- 要素の幅とフォントサイズに応じて自然に折り返される
- 技術用語やコマンドの途中で意図的に `\n` を入れない
- 箇条書きは `\n` で区切る（`\\n` はエスケープされてそのまま表示されるので使わない）

### コードブロック
- 最大8行（長い場合は要点のみ抽出）
- コメントで何をしているか説明
- 実行可能な具体例を優先

## Transition Defaults

| Context | Type | Duration |
|---------|------|----------|
| Default | `fade` | 0.5 |
| Content flow | `slide-left` | 0.4 |
| Section change | `fade` | 0.3 |
| Emphasis | `zoom` | 0.4 |

## Animation Defaults

```json
{ "type": "fade-in", "duration": 0.3-0.5, "delay": 0.1-0.3, "easing": "ease-out", "trigger": "onEnter", "step_index": 0 }
```

- title: delay 0.1, duration 0.3
- body: delay 0.3, duration 0.4
- key-stat number: `scale-in`, delay 0.1
- summary cards: `slide-in-bottom`, staggered delay 0.2/0.35/0.5

## Narration Rules (VOICEVOX)

All narration text MUST be Japanese. English words, technical terms, and abbreviations MUST be written in katakana.

### カタカナ変換

| English | Katakana |
|---------|----------|
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
| HTTP | エイチティーティーピー |
| URL | ユーアールエル |
| MCP | エムシーピー |
| SDK | エスディーケー |
| OAuth | オーオース |
| WebSocket | ウェブソケット |
| WASM | ウェブアセンブリ |
| ARM | アーム |
| VS Code | ブイエスコード |
| Slack | スラック |
| CI/CD | シーアイシーディー |

Do NOT leave any alphabetic words as-is in narration text.

### ナレーション品質ルール

1. **画面を補完する** — スライドに書いてあることをそのまま読まない。背景や意義を補足する
2. **自然な話し言葉** — 箇条書きを流暢な文章に変換する
3. **コードは説明に変換** — コードを読み上げず「このコマンドを実行すると〜」と説明
4. **1スライド30〜60秒** — 短すぎず長すぎず
5. **技術用語は初出時に軽く説明** — 「エムシーピー、つまりモデルコンテキストプロトコルの〜」

### ナレーション例

**悪い例（スライドの丸読み）:**
「リモートコントロールサブコマンドが追加されました。スマホやタブレットからブラウザ経由でアクセス。」

**良い例（補完・文脈追加）:**
「クロードリモートコントロールというサブコマンドが追加されました。ターミナルでこのコマンドを実行すると、スマホのブラウザからクロードコードにアクセスできるようになります。重いリファクタリングを走らせている間に、スマホから進捗を確認できるのは便利ですね。」

## Design Accent Patterns

### アクセントバー
コンテンツスライドに薄いカラーバーを追加して視覚的な区切りを作る:
- **左端縦バー**: width:4, height:1080, x:0 — セクションの色を反映
- **上端横バー**: width:1920, height:4, y:0 — 全幅アクセント
- **下端横バー**: width:1920, height:6-10, y:1070 — フッター風

### バッジ/タグ
バージョン番号やキーワードを強調:
```
fontSize: 22-26, backgroundColor: accent, color: background, padding: 12-14
```

## Important Notes

- `slide_create_presentation` creates a project dir: `projects/{name}/{name}.slide.json`
- The first slide created by `slide_create_presentation` is a default blank. Replace or remove it.
- Gradient stops use `position` (0-100), NOT `offset`.
- `file_path` for all tools — use **absolute path** to avoid resolution issues.
- `updatedAt` is set automatically by the MCP server on every write.
- For text content, use Markdown format (rendered via react-markdown).
- Always call `slide_list_slides` after building to verify the result.
- **フォントサイズを変更したら要素の height も必ず調整する**（見切れ防止）。
