# レイアウトパターン

1920x1080 キャンバスにおける各レイアウトの要素位置・サイズ。

すべての値はピクセル単位。端からのマージン: 水平100px、垂直50px。

## 高さ計算ルール

**重要**: 要素の高さは実際のコンテンツを収容できるサイズにすること。

```
必要な高さ = 行数 x fontSize x lineHeight + padding x 2 + 10
```

- `padding` はテキスト要素の `style.padding` 値。上下両方に適用されるため **x2** が必要
- Markdown の箇条書きは1項目 = 最低1行としてカウント
- コードブロックは行数をそのままカウント

JSON生成時は、Markdownコンテンツの実際の行数（箇条書き項目を含む）を数えて高さを設定する。**テキストが見切れる固定の高さは絶対に使わない。** コンテンツが長い場合はフォントサイズを下げるか、スライドを分割する。

## title-hero

大きな中央揃えタイトル + オプションのサブタイトル。カバースライド用。

```
タイトル:     position(100, 300)  size(1720, 240)  fontSize:80  bold  center
サブタイトル:  position(100, 560)  size(1720, 140)  fontSize:40  normal center
```

背景: グラデーション推奨（accent → accentSecondary, 角度135）

## title-body

上部タイトル + 箇条書き本文。最も一般的なコンテンツレイアウト。

```
タイトル: position(100, 50)   size(1720, 140)  fontSize:52  bold  left
本文:     position(100, 220)  size(1720, 780)  fontSize:36  normal left  lineHeight:1.7
```

背景: ソリッドカラー（background）

## two-column

タイトル + 2つの等幅テキストカラム。

```
タイトル:  position(100, 50)    size(1720, 140)  fontSize:52  bold  left
左カラム:  position(100, 220)   size(820, 780)   fontSize:32  normal left  lineHeight:1.7
右カラム:  position(1000, 220)  size(820, 780)   fontSize:32  normal left  lineHeight:1.7
```

## comparison

カテゴリヘッダー付きの色分け2カラム比較。

```
タイトル:    position(100, 50)    size(1720, 130)  fontSize:52  bold   center
左ヘッダー:  position(100, 210)   size(830, 80)    fontSize:36  bold   center  bgColor:accent     padding:16
左本文:      position(100, 310)   size(830, 700)   fontSize:32  normal left    lineHeight:1.7
右ヘッダー:  position(1000, 210)  size(820, 80)    fontSize:36  bold   center  bgColor:accentSecondary padding:16
右本文:      position(1000, 310)  size(820, 700)   fontSize:32  normal left    lineHeight:1.7
```

## section-divider

グラデーション背景に中央揃えのセクション名。

```
セクション名: position(100, 380)  size(1720, 320)  fontSize:64  bold  center
```

背景: グラデーション（accent → accentSecondary, 角度135）

## quote

中央揃えのイタリック引用 + 出典。

```
引用:  position(160, 240)  size(1600, 420)  fontSize:44  italic center  lineHeight:1.8
出典:  position(160, 700)  size(1600, 100)  fontSize:28  normal center  color:textMuted
```

## key-stat

大きな数値を中心に、文脈テキストを添える。

```
数値:  position(100, 180)  size(1720, 320)  fontSize:160 bold   center  color:accent
ラベル: position(100, 520)  size(1720, 120)  fontSize:40  normal center  color:textSecondary
文脈:  position(160, 680)  size(1600, 220)  fontSize:32  normal center  color:textMuted
```

## three-point

タイトル + 3つの等間隔コンテンツブロック。

```
タイトル:  position(100, 50)    size(1720, 140)  fontSize:52  bold  left
ブロック1: position(100, 220)   size(540, 780)   fontSize:28  normal left  lineHeight:1.6
ブロック2: position(690, 220)   size(540, 780)   fontSize:28  normal left  lineHeight:1.6
ブロック3: position(1280, 220)  size(540, 780)   fontSize:28  normal left  lineHeight:1.6
```

各ブロックのMarkdown内で `### 見出し` を使用してブロックタイトルにする。

## image-text

左に画像、右にテキストコンテンツ。

```
画像エリア: position(60, 60)     size(900, 960)   (ImageElement, fit: contain)
タイトル:   position(1020, 80)   size(840, 140)   fontSize:44  bold  left
本文:       position(1020, 250)  size(840, 750)   fontSize:32  normal left  lineHeight:1.7
```

`--with-images` 使用時は Gemini CLI で画像を自動生成し src を設定。
未使用時は src を空にする（ユーザーがエディタで追加）。

## title-body-image

title-body レイアウト + 右側のアクセント画像。`--with-images` でコンテンツスライドにイラストが必要な場合に使用。

```
タイトル: position(100, 50)    size(1100, 140)  fontSize:52  bold  left
本文:     position(100, 220)   size(1100, 780)  fontSize:36  normal left  lineHeight:1.7
画像:     position(1260, 140)  size(580, 580)   (ImageElement, fit: contain)  zIndex:1
```

## title-hero-image

背景画像付きカバースライド。半透明オーバーレイの上にテキストを重ねる。

```
背景: image（fit: cover, 生成された画像）
オーバーレイ: position(0, 0)      size(1920, 1080)  bgColor:rgba(bg, 0.6)  zIndex:1
タイトル:     position(100, 300)  size(1720, 240)   fontSize:80  bold  center  zIndex:2
サブタイトル: position(100, 560)  size(1720, 140)   fontSize:40  center  zIndex:3
```

## section-divider-image

背景画像付きセクション区切り。

```
背景: image（fit: cover, オーバーレイで透明度調整）
オーバーレイ: position(0, 0)      size(1920, 1080)  bgColor:rgba(bg, 0.7)  zIndex:1
セクション名: position(100, 380)  size(1720, 320)   fontSize:64  bold  center  zIndex:2
```

## closing

最終スライド用の中央揃えクロージングメッセージ。

```
メッセージ:   position(100, 320)  size(1720, 240)  fontSize:56  bold   center
サブテキスト: position(160, 600)  size(1600, 180)  fontSize:32  normal center  color:textMuted
```

背景: グラデーションまたはソリッド（カバースライドのスタイルに合わせる）

## レイアウト選択ガイド

| コンテンツタイプ | 推奨レイアウト |
|----------------|--------------|
| デッキタイトル | `title-hero` |
| メインコンテンツ | `title-body` |
| 2つの概念 | `two-column` |
| Before/After、長所/短所 | `comparison` |
| 新セクション | `section-divider` |
| 重要な洞察、推薦コメント | `quote` |
| インパクトのある指標 | `key-stat` |
| 3つの特徴・メリット | `three-point` |
| 機能 + ビジュアル | `image-text` |
| 最終スライド | `closing` |

## スライドの流れパターン

| 位置 | 推奨 |
|------|------|
| スライド1 | `title-hero`（常に） |
| スライド2 | `title-body`（アジェンダ/概要） |
| セクション開始 | `section-divider` |
| コンテンツ | `title-body`, `two-column`, `three-point` |
| データ/インパクト | `key-stat` |
| 洞察 | `quote` |
| 最終スライド | `closing`（常に） |
