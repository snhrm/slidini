---
name: slidini-mcp
description: "スライドプレゼンテーションの作成・編集・ナレーション設定を行う統合スキル。MCP ツール（slide_*）による個別編集と、JSON 一括生成による新規作成の両方に対応。YouTube動画の台本作成→スライド→ナレーション→音声生成まで一気通貫で実行可能。トリガー: 'スライド作成', 'プレゼンを作って', 'ナレーション追加', 'BGM設定', 'make slides', 'create presentation', 'スライドを作って', 'プレゼン作成', '動画を作りたい', 'YouTubeの原稿', '解説動画の台本', '紹介動画', '営業用の動画', '動画台本', 'YouTube台本', 'スライド動画'"
---

# Slidini スライド作成スキル

プレゼンテーションの新規作成・編集・再生設定を行う統合スキル。

## 概要

3つの作成モードを使い分ける:

1. **一括生成モード**: 完全な `.slide.json` を直接生成（新規プレゼン作成時に使用）
2. **台本モード**: 台本（スクリプト）を作成→スライド→ナレーション→音声生成まで一気通貫（YouTube動画・解説動画に最適）
3. **MCP 編集モード**: `mcp__slidini__slide_*` ツールで個別要素を操作（既存プレゼンの編集時に使用）

## 使い方

```
/slidini-mcp コンテンツ.md                          # デフォルトスタイルで一括生成
/slidini-mcp コンテンツ.md --style canva-frame      # Canvaフレームスタイル
/slidini-mcp コンテンツ.md --color-set midnight-blue # カラーセット指定
/slidini-mcp コンテンツ.md --slides 10              # スライド数指定
/slidini-mcp コンテンツ.md --with-images            # Gemini CLI で画像生成
/slidini-mcp                                        # 内容を対話的に入力
/slidini-mcp --script "React19の新機能"              # 台本モード: 台本→スライド→音声
/slidini-mcp --script "会社紹介" --script-only       # 台本のみ出力
/slidini-mcp --script "サービス紹介" --skip-audio    # 音声生成スキップ
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
| `--script <トピック>` | 台本モード: トピックから台本→スライド→音声を一気通貫生成 |
| `--script-only` | 台本Markdownのみ出力（スライド生成しない） |
| `--skip-audio` | 音声生成をスキップ |

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

## ワークフロー: 台本モード（`--script`）

YouTube動画・解説動画向けに、台本作成→スライド→ナレーション→音声生成を一気通貫で実行する。

### フェーズ1: 台本作成

#### ステップ1: ターゲット特定

ユーザーの入力からターゲットを判断し、該当する参照ファイルを読み込む。

| ターゲット | 参照ファイル | 判断のヒント |
|-----------|-------------|-------------|
| WEBエンジニア | `references/script-web-engineer.md` | 技術解説、プログラミング、フレームワーク、ツール紹介 |
| 営業資料 | `references/script-sales.md` | 商品提案、顧客向けプレゼン、売上・ROI訴求 |
| 会社紹介 | `references/script-company-intro.md` | 企業の理念、沿革、採用向け、IR向け |
| サービス紹介 | `references/script-service-intro.md` | プロダクト紹介、機能説明、導入事例、デモ |

明示的な指定がない場合はユーザーに確認。複数ターゲットにまたがる場合は主ターゲットをベースに補足的に併用。

#### ステップ2: リサーチ＋構成設計

1. Web検索で最新情報を収集
2. 全体の流れ（スライド数、セクション配分）を設計
3. 参照ファイルの構成ガイドに従う

#### ステップ3: 台本ドラフト執筆

スライドごとに以下の形式で記述:

```markdown
---

## スライド {番号}: {スライドタイトル}

**スライド内容:**

（スライドに表示するテキスト・コード・図の指示）

**ナレーション:**

> （読み上げ原稿。blockquote形式。）

**演出メモ:**

（アニメーション指示、強調ポイント。なければ省略可。）

---
```

#### ステップ4: ファクトチェック

ドラフト内の事実に基づく主張を Web 検索で検証。結果はチャットでユーザーに報告（台本には含めない）。

#### ステップ5: 台本ファイル出力

`projects/{slug}/{slug}-script.md` に保存。末尾に出典・参考リンクセクションを追加。

`--script-only` の場合はここで終了。

### フェーズ2: スライド＋音声生成

台本完成後、一括生成モードと同じ手順でスライドを生成する。

1. **台本をコンテンツとして分析** — 台本の各スライドを1枚のスライドにマッピング
   - 「スライド内容」→ テキスト要素
   - 「ナレーション」→ `playback.slides[].narration`
   - 「演出メモ」→ アニメーション・トランジション
2. **スタイル・カラーセット確認** — 未指定なら自動推奨を提示
3. **JSON 一括生成** — `projects/{slug}/{slug}.slide.json` に Write
4. **ナレーション音声生成**（`--skip-audio` でなければ）
   - `video-export` パッケージの設定に従い音声を合成（デフォルト: 春日部つむぎ, speaker=8）
   - **スピーカーIDやVOICEVOX URLをハードコードしない** — `video-export/src/config.ts` のデフォルト値を参照
   - `audio/slide-{NN}.wav` に保存
   - `slide_set_slide_narration` で `narration` と `audio_file` を両方設定
5. **スライド表示時間の自動調整**
   - 各音声ファイルの実際の長さを `wave` モジュールで取得
   - `playback.slides[].duration` = 音声の長さ + 1秒（バッファ）に設定
   - 音声がないスライドは `defaultSlideDuration` を使用
   ```python
   import wave
   with wave.open(audio_path, 'r') as w:
       audio_duration = w.getnframes() / w.getframerate()
   slide_duration = round(audio_duration + 1, 1)
   ```
6. **サマリー表示**

### 台本の構成テンプレート（共通）

「導入で興味を引く → 本題を段階的に深掘る → まとめで行動を促す」が基本の流れ:

1. **フック**（1〜2スライド）: 視聴者の関心を引く導入。切り口は参照ファイルに従う
2. **アジェンダ**（1スライド）: 動画で扱う内容の概要
3. **本題**: 論理的ステップに分解。1スライド1メッセージ、具体例必須、つなぎの言葉
4. **まとめ**（1〜2スライド）: 要点の振り返り＋次のアクション
5. **エンディング**: チャンネル登録・高評価の促し

### 動画の長さ目安

| トピックの複雑さ | 時間 | スライド数 |
|-----------------|------|-----------|
| 単一概念の紹介 | 5〜8分 | 10〜15枚 |
| 比較・選定ガイド | 10〜15分 | 15〜25枚 |
| 詳細チュートリアル・総合紹介 | 15〜25分 | 20〜35枚 |

### ビジュアル表現のバリエーション

テキストの羅列を避け、以下を意識的に組み合わせる:

- **比較表**: 2つ以上の要素を比較する場面
- **箇条書きリスト**: 3スライド以上連続させない
- **図解・ダイアグラム指示**: Mermaid記法など
- **強調・装飾**: 重要なキーワードは **太字**、注意点は目立たせる

ターゲット固有のビジュアル要素は各 `script-*.md` を参照。

### 台本の留意事項

- 1スライドの情報量を「15秒で理解できるか？」で自問
- ナレーション原稿は声に出して自然な日本語に
- 良し悪しを断定しすぎない。トレードオフを公平に提示
- ファクトチェック: 数値データ・固有名詞・時系列情報・引用を検証

## ワークフロー: MCP 編集モード

既存プレゼンの修正には MCP ツールを使用。

### 利用可能な MCP ツール

#### プレゼンテーション管理
| ツール | 用途 |
|--------|------|
| `slide_create_presentation` | 新規プロジェクト作成 |
| `slide_read_presentation` | プレゼン全体を読む |
| `slide_list_slides` | スライド一覧取得（ID・要素数・背景タイプ） |
| `slide_read_slide` | 特定スライドの全データ取得（slide_id or slide_index） |
| `slide_update_meta` | タイトル・サイズ変更 |

#### スライド操作
| ツール | 用途 |
|--------|------|
| `slide_add_slide` | 空白スライド追加 |
| `slide_add_slide_from_template` | テンプレートからスライド追加 |
| `slide_remove_slide` | スライド削除 |
| `slide_reorder_slides` | スライド順序変更 |
| `slide_update_slide_background` | 背景変更（単色/グラデーション/画像） |
| `slide_update_slide_transition` | トランジション変更（全21種対応） |

#### 要素操作
| ツール | 用途 |
|--------|------|
| `slide_add_text_element` | テキスト要素追加（Markdown対応） |
| `slide_add_image_element` | 画像要素追加 |
| `slide_add_chart_element` | チャート追加（棒/折線/円/ドーナツ/エリア/レーダー） |
| `slide_update_element` | 要素プロパティ更新（テキスト全スタイル・画像fit・動画再生設定・チャートデータ&スタイル・childStagger） |
| `slide_remove_element` | 要素削除 |

#### アニメーション操作
| ツール | 用途 |
|--------|------|
| `slide_add_element_animation` | アニメーション追加（全24種対応・childStagger設定可） |
| `slide_update_element_animation` | 既存アニメーションの更新（インデックス指定・childStagger追加/削除） |
| `slide_remove_element_animation` | アニメーション削除（インデックス指定 or 全削除） |

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
| 本文 | 36-40 |
| 箇条書き | 36-40 |
| コードブロック | 24-28 |
| キャプション | 22-28 |
| 統計数値 | 120-180 |

### 余白フィッティングルール

**JSON生成後、全スライドの余白を検証し自動調整する。** コンテンツスライドで `1080 - 最下端要素のbottom > 80px` なら余白過多。

#### 調整手順

1. **コンテンツ量に応じてフォントサイズを決定する**（小さく作って後から調整ではなく、最初から適切なサイズで）:
   - 箇条書き3項目以下 → fontSize: 38-40, lineHeight: 2.0
   - 箇条書き4-5項目 → fontSize: 36-38, lineHeight: 1.8-2.0
   - 箇条書き6項目以上 → fontSize: 34, lineHeight: 1.7（またはスライド分割）
   - カード内テキスト → fontSize: 34, lineHeight: 1.7, padding: 44
2. **要素の height は必ずコンテンツ量から計算する**（固定値を使わない）
3. **カードグリッドの下端は y:1020〜1050** に届くようにカードの height を拡大する
4. **padding は 40-48** を基本とする（36以下だと窮屈に見える）
5. 白カード（`backgroundColor: "#ffffff"` + `padding: 44`）で領域を確保
6. 補足テキスト（note）はカードの下に配置し、y:800〜830 付近に下げる
7. **それでも余白が残る場合**: 文章を中央寄せ、装飾要素（区切り線、アクセントバー）を追加

#### ツリー・ディレクトリ構造の表示

ファイルツリーやディレクトリ構造は **コードブロックスタイル** で表示する:

- Markdownの ``` で囲む
- 要素の背景をダーク（`backgroundColor: "#1e293b"`）、テキストをライト（`color: "#e2e8f0"`）
- 等幅フォント（`fontFamily: "Source Code Pro"`）
- fontSize: 24, lineHeight: 1.6, padding: 36

### 要素サイズ計算ルール

**重要: fontSize・padding・lineHeight を変更したら、要素の height を必ず再計算すること。見切れもオーバーサイズも許容しない。**

```
height = 行数 × fontSize × lineHeight + padding × 2 + 10
```

- Markdownの箇条書きは1項目 = 最低1行としてカウント
- コードブロックは行数をそのままカウント
- 空行（`\n\n`）も1行としてカウント
- **見切れ防止**: 計算結果より小さい height を設定しない
- **オーバーサイズ防止**: 計算結果の1.3倍を超える height にしない（余白が目立つ）
- 複数要素が縦に並ぶ場合、上の要素の height を変更したら下の要素の y も連動して調整する

## トランジション

| コンテキスト | タイプ | 所要時間 |
|-------------|--------|---------|
| **タイトル（1枚目）** | **`none`** | — |
| デフォルト | `fade` | 0.5s |
| コンテンツ間 | `slide-left` | 0.4s |
| セクション切替 | `fade` | 0.3s |
| 強調 | `zoom` | 0.4s |

**注意**: タイトルスライド（1枚目）は必ず `none` にすること。トランジションがあると動画書き出し時のサムネイルが黒くなる。

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

### 音声同期ルール

音声ファイル生成後、スライド表示時間を音声に合わせる:

```
duration = WAV音声の長さ(秒) + 1.0s（バッファ）
```

- `ffprobe -v quiet -show_entries format=duration -of csv=p=0 <file>` で音声長を取得
- 既存の duration と比較し、差分があるスライドのみ更新
- `slide_set_slide_narration` で `duration` を設定

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
- Markdownのアクセントカラーは青系（`#3b82f6`）: `**太字**` の背景、リスト項目のボーダー・背景、テーブルヘッダー、blockquote、hrなどすべて青系で統一
- `**太字**` を多用しない — `*斜体*` や `_斜体_` と使い分ける（詳細は `references/content-rules.md`）
- オーバーレイとの重なり: ブロック要素は重ねてOK、テキストの改行で回避（詳細は `references/design-guidelines.md`）
- **フォントサイズ変更時は height も必ず調整**
- 見切れ修正の優先順序: height拡大 → y微調整 → fontSize調整 → コンテンツ分割（詳細は `references/design-guidelines.md`）
- タイトルスライドの装飾は Fractured Data Panels 等のプリセットを使用（詳細は `references/design-guidelines.md`）

## リファレンス

### スライド生成

| ファイル | 内容 |
|---------|------|
| `references/deck-styles.md` | デッキスタイル定義（default, canva-frame, speakerdeck） |
| `references/layouts.md` | レイアウトパターンの座標 |
| `references/content-rules.md` | コンテンツ・スタイルルール |
| `references/outline-template.md` | アウトラインテンプレート |
| `references/design-guidelines.md` | デザインガイドライン（ビジュアル階層・原則） |
| `references/presentation-advice.md` | 登壇資料デザインの極意（コンテンツ・デザイン原則） |
| `references/image-generation.md` | Gemini CLI による画像生成 |

### 台本モード（ターゲット別ガイド）

| ファイル | ターゲット |
|---------|-----------|
| `references/script-web-engineer.md` | WEBエンジニア向け技術解説 |
| `references/script-sales.md` | 営業資料・提案書 |
| `references/script-company-intro.md` | 会社紹介（採用・IR・汎用） |
| `references/script-service-intro.md` | サービス・プロダクト紹介 |
