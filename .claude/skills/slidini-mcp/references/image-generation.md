# Gemini CLI による画像生成

スライド用イラストを Gemini CLI で生成するためのガイド。

## 生成方法（優先順）

上から順に試し、最初に成功した方法を使用する。

### 方法1: Gemini CLI + Nanobanana 拡張

nanobanana 拡張がインストールされている場合に最適。

**利用可能か確認**:
```bash
gemini -p "list your available tools" --output-format json -y 2>/dev/null | head -20
```

**画像生成**:
```bash
gemini -p "/generate \"[プロンプト]\" --styles=\"[スタイル]\"" -y 2>/dev/null
```

画像は `./nanobanana-output/` に保存される。生成後にターゲットディレクトリへ移動する。

**Nanobanana のインストール**（未利用の場合）:
```bash
gemini extensions install https://github.com/gemini-cli-extensions/nanobanana
```

### 方法2: Gemini CLI 直接実行（ヘッドレスモード）

Gemini CLI のネイティブ画像生成機能を使用。

```bash
gemini -p "Generate an image: [プロンプト]. Save the image as [出力パス]." -y 2>/dev/null
```

`-y` フラグでファイル操作を自動承認。`-p` フラグで非対話（ヘッドレス）モードで実行。

### 方法3: Gemini API スクリプト経由

TypeScript スクリプトで API を直接呼び出す。

```bash
npx -y bun -e "
import { GoogleGenAI } from '@google/genai';
import { writeFileSync } from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY });
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash-image',
  contents: process.argv[2],
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig: { aspectRatio: '16:9' }
  }
});

for (const part of response.candidates[0].content.parts) {
  if (part.inlineData) {
    writeFileSync(process.argv[3], Buffer.from(part.inlineData.data, 'base64'));
    console.log('保存:', process.argv[3]);
    break;
  }
}
" "[プロンプト]" "[出力パス]"
```

**必要**: `GEMINI_API_KEY` または `GOOGLE_API_KEY` 環境変数。

**依存関係のインストール**（必要な場合）:
```bash
bun add @google/genai  # 一時ディレクトリで実行可
```

### 方法4: テキストのみにフォールバック

上記すべてが使えない場合、テキストのみでスライドを生成する。ユーザーに通知:
```
画像生成が利用できません（Gemini CLI が未設定）。
テキストのみのスライドを生成します。画像は後で slidini エディタから追加してください。
```

## スライドイラスト用のプロンプト設計

### 基本プロンプトテンプレート

```
プレゼンテーションスライド用の[スタイル]イラストを作成してください。
テーマ: [テーマ]
スタイル: [スタイル詳細]
アスペクト比: 16:9
要件:
- クリーンでプロフェッショナルなプレゼン品質の画像
- 画像内にテキストやラベルは含めない
- [カラー指定]
- スライド背景やアクセントに適したシンプルな構図
```

### スタイル別プロンプト修飾子

| スタイル | プロンプト追加文 |
|---------|----------------|
| `flat-illustration` | 「クリーンなシェイプのフラットベクターイラスト、グラデーションなし、太めのソリッドカラー、シンプルな幾何学形状」 |
| `watercolor` | 「柔らかい水彩画、穏やかなカラーウォッシュ、有機的な輪郭、微かな紙のテクスチャ」 |
| `sketch` | 「手描き鉛筆スケッチ、クリーンな線画、クロスハッチングによるシェーディング、最小限の色」 |
| `photorealistic` | 「フォトリアルな高品質写真、プロフェッショナルなライティング、浅い被写界深度」 |
| `minimalist` | 「ウルトラミニマルなイラスト、最大限の余白、1〜2つのシンプルなシェイプ、モノクロ+単色アクセント」 |
| `abstract` | 「重なり合うシェイプの抽象的な幾何学構成、太めのカラーブロック、ダイナミックな角度」 |
| `pixel-art` | 「8ビットスタイルのレトロピクセルアート、大きめのピクセル、限られたカラーパレット、懐かしいゲーム風」 |

### カラーセットに合わせたカラー指定

イラストの色をスライドのカラーセットに合わせる:

| カラーセット | カラー指定 |
|------------|----------|
| `dark-slate` | 「クールなブルーグレートーン（#1e293b, #334155）にパープルブルーのアクセント（#667eea）」 |
| `light-clean` | 「明るいニュートラルトーンにブルー（#3b82f6）とパープル（#8b5cf6）のアクセント、白背景」 |
| `midnight-blue` | 「ディープネイビー（#0f172a）にシアン（#38bdf8）とインディゴ（#818cf8）のアクセント」 |
| `warm-sunset` | 「ウォームなダークトーン（#1c1917）にアンバー（#f59e0b）とレッド（#ef4444）のアクセント」 |
| `forest-green` | 「ディープフォレストグリーン（#052e16）にブライトグリーン（#22c55e）とシアン（#06b6d4）のアクセント」 |
| `monochrome` | 「グレースケールのみ、ブラック（#18181b）からホワイト（#fafafa）、色なし」 |

### スライドタイプ別プロンプト

**カバースライド**:
```
「[トピック]」のコンセプトを表す[スタイル]イラストを作成してください。
プレゼンテーションカバーに適したワイドパノラマ構図。
抽象的・比喩的な表現で、文字通りの描写ではなく。
[カラー指定]
```

**コンテンツスライド**（アクセント画像）:
```
[具体的な対象]の小さな[スタイル]イラストを作成してください。
スライドアクセントに適したシンプルでアイコニックな表現。
透明またはソリッドな背景のクリーンな構図。
[カラー指定]
```

**セクション区切り**:
```
セクション区切りスライド用の[スタイル]抽象パターンまたはテクスチャを作成してください。
控えめで、主張しすぎないもの。30%の透明度で背景オーバーレイとして機能するもの。
[カラー指定]
```

## JSON への画像埋め込み

### 背景画像として

カバースライドやセクション区切りでは、画像をスライド背景として使用:

```json
{
  "background": {
    "type": "image",
    "src": "./images/01-cover.png",
    "fit": "cover"
  }
}
```

テキストの可読性のために半透明オーバーレイを追加:
```json
{
  "type": "text",
  "position": { "x": 0, "y": 0 },
  "size": { "width": 1920, "height": 1080 },
  "content": "",
  "style": {
    "backgroundColor": "rgba(30, 41, 59, 0.6)",
    "color": "#ffffff",
    "fontSize": 1
  },
  "zIndex": 1
}
```
その後、実際のテキスト要素をその上（zIndex: 2+）に配置する。

### インライン画像要素として

イラスト付きのコンテンツスライド用:

```json
{
  "type": "image",
  "id": "[一意のID]",
  "src": "./images/03-illustration.png",
  "fit": "contain",
  "position": { "x": "[x]", "y": "[y]" },
  "size": { "width": "[w]", "height": "[h]" },
  "rotation": 0,
  "opacity": 1,
  "zIndex": 1,
  "animations": [{
    "type": "fade-in",
    "duration": 0.5,
    "delay": 0.1,
    "easing": "ease-out",
    "trigger": "onEnter",
    "stepIndex": 0
  }]
}
```

## 画像スライドのレイアウト調整

画像があるスライドでは、テキスト要素の位置を調整する:

### 背景画像付き title-hero

```
背景:         image（fit: cover）
オーバーレイ:  position(0, 0)       size(1920, 1080)  bgColor: rgba(bg, 0.6)  zIndex:1
タイトル:      position(160, 340)   size(1600, 200)   fontSize:72  bold  center  zIndex:2
サブタイトル:  position(160, 560)   size(1600, 120)   fontSize:36  center  zIndex:3
```

### 右側アクセント画像付き title-body

```
タイトル: position(120, 60)    size(1080, 160)   fontSize:48  bold  left
本文:     position(120, 260)   size(1080, 700)   fontSize:32  normal left
画像:     position(1260, 160)  size(540, 540)    fit:contain   zIndex:1
```

### image-text（左画像、右テキスト）

```
画像:     position(120, 120)    size(840, 840)   fit:contain
タイトル: position(1040, 120)   size(760, 120)   fontSize:40  bold
本文:     position(1040, 280)   size(760, 680)   fontSize:28  normal
```

## 画像ファイルの命名規則

形式: `{NN}-{スラグ}.png`

| スライド | ファイル名 |
|---------|----------|
| カバー | `01-cover.png` |
| コンテンツスライド3 | `03-key-finding.png` |
| セクション区切り5 | `05-section-growth.png` |
| クロージング | `10-closing.png` |

## エラーハンドリング

| エラー | 対応 |
|--------|------|
| Gemini CLI が見つからない | テキストのみにフォールバック、ユーザーに警告 |
| APIキーが未設定 | テキストのみにフォールバック、セットアップ手順を表示 |
| 生成に失敗 | 自動で1回リトライ、それでも失敗なら警告付きでスキップ |
| 画像保存に失敗 | 警告付きでスキップ、残りのスライドは続行 |
| 全画像が失敗 | テキストのみの出力で完了、エラーを報告 |

## Gemini API モデル

| モデル | ID | 備考 |
|--------|-----|------|
| Nano Banana（デフォルト） | `gemini-2.5-flash-image` | 高速、効率的 |
| Nano Banana Pro | `gemini-3-pro-image-preview` | 高品質、低速 |

nanobanana 拡張使用時に Pro 品質にするには `NANOBANANA_MODEL=gemini-3-pro-image-preview` を設定。
