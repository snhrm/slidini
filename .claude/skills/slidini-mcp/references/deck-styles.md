# デッキスタイル

プレゼンテーション全体のビジュアルスタイルを定義する。スライド作成時に `--style` オプションで指定。

## default（デフォルト）

シンプルなスタイル。セクション区切りはグラデーション、コンテンツはソリッドカラー背景。

### 構造
- **セクション区切り**: グラデーション背景（accent → accentSecondary, 135°）+ 白テキスト中央
- **コンテンツ**: ソリッド背景 + タイトル左寄せ + アクセントバー
- **カバー/クロージング**: グラデーション背景

### カラー適用
```
セクション背景: gradient(accent → accentSecondary)
コンテンツ背景: background
タイトル色: textPrimary
本文色: textSecondary
アクセントバー: accent（width:4, height:全高, x:0）
```

---

## canva-frame（キャンバフレーム）

Canvaのプレゼンテーションテンプレートを参考にしたスタイル。ネイビーのボーダーフレーム、中央タイトル+区切り線が特徴。

### 構造
- **セクション区切り**: ダークネイビーグラデーション + 白テキスト中央
- **コンテンツ**: 白背景 + ネイビーボーダーフレーム（8px） + 中央タイトル + 横線セパレータ
- **タイトルスライド**: ダークグラデーション + 白ボックスにサブタイトル
- **クロージング**: ダークグラデーション + 区切り線 + サブテキスト

### カラーパレット
```
グラデーション: #0a1628 → #1e3a5f（角度180°）
フレーム色: #172554
コンテンツ背景: #ffffff
タイトル色: #172554
本文色: #334155
アクセント: #1e3a8a
セカンダリ: #3b82f6
ミュート: #64748b
パネル背景: #f1f5f9
区切り線: #172554（高さ3px）
```

### コンテンツスライドのレイヤー構造（ボーダーフレーム）

```
zIndex:0  — ボーダー背景（フルサイズ, backgroundColor: #172554）
  position(0, 0) size(1920, 1080)

zIndex:1  — 白い内側パネル
  position(8, 8) size(1904, 1064)  backgroundColor: #ffffff

zIndex:10 — タイトル（中央揃え）
  position(140, 50) size(1640, 90) fontSize:48 bold center color:#172554

zIndex:10 — 区切り線
  position(140, 150) size(1640, 3) backgroundColor: #172554

zIndex:10 — 本文コンテンツ
  position(140, 200) size(1640, 780) fontSize:28-32 color:#334155
```

### セクション区切りスライド

```
背景: gradient(linear, 180°, #0a1628 → #1e3a5f)
タイトル: position(160, 400) size(1600, 160) fontSize:72 bold center color:#ffffff
アニメーション: fade-in, delay:0.1
```

### タイトルスライド

```
背景: gradient(linear, 180°, #0a1628 → #1e3a5f)
メインタイトル: position(160, 240) size(1600, 300) fontSize:80 bold center color:#ffffff
サブタイトル: position(460, 580) size(1000, 70) fontSize:28 bold center
  color:#172554  backgroundColor:#ffffff  padding:16
```

### 2カラムレイアウト

```
ボーダーフレーム + タイトル + 区切り線（共通）
左パネル:  position(60, 190)  size(880, 820)  padding:32  backgroundColor:#f1f5f9
右パネル:  position(980, 190) size(880, 820)  padding:32  backgroundColor:#f1f5f9
```

### 統計カード（3カラム）

```
ボーダーフレーム + タイトル + 区切り線（共通）
カード1: position(100, 240)  size(520, 300) fontSize:120 bold center
  color:#1e3a8a  backgroundColor:#f1f5f9  padding:40
ラベル1: position(100, 560)  size(520, 60)  fontSize:24 center color:#64748b

カード2: position(700, 240) ...（同構造、color:#3b82f6）
カード3: position(1300, 240) ...（同構造、color:#1e3a8a）
```

### チャートスライド

```
ボーダーフレーム + タイトル + 区切り線（共通）
チャート: position(60, 180) size(1800, 860)
  backgroundColor:#f8fafc  textColor:#334155  gridColor:#e2e8f0
  series色: #1e3a8a, #3b82f6, #60a5fa, #93c5fd
```

### クロージングスライド

```
背景: gradient（タイトルスライドと同じ）
タイトル: position(160, 340) size(1600, 200) fontSize:72 bold center color:#ffffff
区切り線: position(660, 540) size(600, 3) backgroundColor:#ffffff opacity:0.5
サブテキスト: position(360, 560) size(1200, 50) fontSize:28 center color:#94a3b8
```

### 推奨カラーセット

`midnight-blue` との相性が最も良い。カスタムカラー（colorSetId: null）でも使用可能。

---

## speakerdeck（スピーカーデック）

SpeakerDeck の登壇スライドを参考にしたスタイル。左寄せ大文字タイトル、余白重視、底部プログレスバーが特徴。「見せる」スライドの設計思想に基づく。

### 設計思想

- **読ませない、見せる** — タイトルで結論を伝え、本文は補足に徹する
- **テキストのジャンプ率を大きく** — キーメッセージは大きく、補足は小さく
- **左端揃え** — 中央揃えは避け、左端を揃える
- **余白を恐れない** — 無理に埋めず、空白を活かす
- **2色で十分** — ベースカラー + アクセントカラーだけ

### 構造
- **カバー/クロージング**: ブルーグラデーション背景 + 白テキスト中央
- **セクション区切り**: ライトグレー背景 + 特大タイトル左上 + 余白多め
- **コンテンツ**: ライトグレー背景 + 大タイトル左上 + 本文左寄せ + プログレスバー
- **プログレスバー**: 底部左端のティールバーがスライド進行に応じて幅が伸びる

### カラーパレット
```
カバー背景: gradient(linear, 135°, #1a5291 → #2b6cb0)
コンテンツ背景: #f0f2f5
タイトル色: #003265
本文色: #1e293b
補足テキスト色: #64748b
アクセント（プログレスバー）: #2dd4bf（ティール）
ハイライト: #003265（ネイビー、図のヘッダー等）
白: #ffffff
```

### プログレスバー

スライドの進行を示す底部のティールバー。スライドインデックスに応じて幅が変わる。

```
計算式: barWidth = (slideIndex / totalSlides) * 1920
position(0, 1070) size(barWidth, 10) backgroundColor: #2dd4bf zIndex:5
```

例（全13スライドの場合）:
- スライド1: width = 148（1/13 × 1920）
- スライド5: width = 738（5/13 × 1920）
- スライド13: width = 1920（全幅）

### カバースライド

```
背景: gradient(linear, 135°, #1a5291 → #2b6cb0)
メインタイトル: position(160, 300) size(1600, 300) fontSize:80 bold center color:#ffffff
サブタイトル: position(160, 640) size(1600, 60) fontSize:32 center color:#ffffff opacity:0.8
著者名: position(160, 740) size(1600, 50) fontSize:28 center color:#ffffff opacity:0.6
```

### セクション区切りスライド

```
背景: color #f0f2f5
アクセントバー: position(100, 340) size(120, 6) backgroundColor:#2dd4bf
タイトル: position(100, 370) size(1200, 200) fontSize:80 bold left color:#003265
サブタイトル: position(100, 500) size(1400, 80) fontSize:36 left color:#64748b
プログレスバー: position(0, 1070) size(barWidth, 10) backgroundColor:#2dd4bf
```

タイトルは縦中央やや上に左寄せ。ティールのアクセントバーをタイトル上に配置。残りは余白を活かす。

### コンテンツスライド

余白が目立つ場合は白カード（`backgroundColor: "#ffffff"` + `padding: 32-40`）で領域を埋める。

```
背景: color #f0f2f5
タイトル: position(100, 60) size(1720, 100) fontSize:56-60 bold left color:#003265
本文: position(100, 210) size(1720, 800) fontSize:28-34 left color:#1e293b lineHeight:1.7-1.8
  → 白カード: backgroundColor:#ffffff padding:36-40
プログレスバー: position(0, 1070) size(barWidth, 10) backgroundColor:#2dd4bf
```

### 2カラムレイアウト（白カード）

```
背景: color #f0f2f5
タイトル: position(100, 60) size(1720, 100) fontSize:56-60 bold left color:#003265
左カード: position(100, 210) size(820, 800) backgroundColor:#ffffff padding:40 fontSize:32
右カード: position(1000, 210) size(820, 800) backgroundColor:#ffffff padding:40 fontSize:32
プログレスバー: position(0, 1070) size(barWidth, 10) backgroundColor:#2dd4bf
```

### 3カラムレイアウト（白カード）

```
背景: color #f0f2f5
タイトル: position(100, 60) size(1720, 100) fontSize:56 bold left color:#003265
カード1: position(100, 200) size(520, 420) backgroundColor:#ffffff padding:36 fontSize:28-30
カード2: position(700, 200) size(520, 420) backgroundColor:#ffffff padding:36 fontSize:28-30
カード3: position(1300, 200) size(520, 420) backgroundColor:#ffffff padding:36 fontSize:28-30
補足: position(100, 680) size(1720, 300) fontSize:30 color:#64748b
プログレスバー: position(0, 1070) size(barWidth, 10) backgroundColor:#2dd4bf
```

### 3x2グリッドレイアウト（白カード6枚）

```
背景: color #f0f2f5
タイトル: position(100, 60) size(1720, 100) fontSize:56 bold left color:#003265
行1: y:200  行2: y:510  カードサイズ: 540x260  padding:32  fontSize:28
  カード(100,200) (690,200) (1280,200)
  カード(100,510) (690,510) (1280,510)
プログレスバー: position(0, 1070) size(barWidth, 10) backgroundColor:#2dd4bf
```

### 2x2グリッドレイアウト（白カード4枚）

```
背景: color #f0f2f5
タイトル: position(100, 60) size(1720, 180) fontSize:60 bold left color:#003265
行1: y:280  カードサイズ: 820x350  行2: y:680  カードサイズ: 820x330
  カード(100,280) (1000,280)
  カード(100,680) (1000,680)
padding:40  fontSize:30  backgroundColor:#ffffff
プログレスバー: position(0, 1070) size(barWidth, 10) backgroundColor:#2dd4bf
```

### 統計カード（key-stat）

```
背景: color #f0f2f5
数値: position(100, 100) size(600, 320) fontSize:200 bold left color:#003265
ラベル: position(100, 430) size(600, 80) fontSize:42 bold left color:#64748b
補足: position(100, 560) size(1720, 400) fontSize:34 left color:#1e293b lineHeight:1.8
プログレスバー: position(0, 1070) size(barWidth, 10) backgroundColor:#2dd4bf
```

### チャートスライド

```
背景: color #f0f2f5
タイトル: position(100, 50) size(1400, 100) fontSize:42 bold left color:#003265
チャート: position(100, 180) size(1720, 820)
  backgroundColor:#ffffff textColor:#1e293b gridColor:#e2e8f0
  series色: #003265, #2b6cb0, #5b9bd5, #2dd4bf
プログレスバー: position(0, 1070) size(barWidth, 10) backgroundColor:#2dd4bf
```

### クロージングスライド

```
背景: gradient(linear, 135°, #1a5291 → #2b6cb0)
タイトル: position(160, 380) size(1600, 200) fontSize:80 bold center color:#ffffff
プログレスバー: position(0, 1070) size(1920, 10) backgroundColor:#2dd4bf（全幅）
```

### 推奨カラーセット

`ocean-breeze` との相性が良い。カスタムカラー（colorSetId: null）での使用を推奨。

---

## 新しいスタイルの追加方法

1. このファイルに新セクションを追加
2. 以下を定義:
   - カラーパレット
   - 各スライドタイプのレイヤー構造
   - レイアウトパターンの座標
3. SKILL.md の `--style` オプションに追加
