# @slidini/video-export

`.slide.json` から MP4 動画を生成する CLI。既存の Framer Motion レンダラーをそのまま利用し、Puppeteer でフレームキャプチャ → FFmpeg でエンコードする。

## 前提条件

- FFmpeg がインストール済みであること
- VOICEVOX を使う場合は VOICEVOX エンジンが起動していること

## 動画生成の 3 フェーズ

```
Phase 1: Audio Preparation
  ├── VOICEVOX でナレーション WAV を合成 (or 指定の音声ファイルを読込)
  ├── 音声の長さからスライドごとの表示時間を決定
  └── BGM のタイムレンジを算出

Phase 2: Frame Capture
  ├── Vite 開発サーバーを起動 (export-app)
  ├── Puppeteer + timeweb でブラウザの時間を仮想化
  ├── 1 フレームずつ goTo(ms) でスクリーンショット取得
  └── PNG を FFmpeg の stdin にパイプ

Phase 3: Audio Encoding
  └── FFmpeg で映像 + ナレーション + BGM をミックスして MP4 出力
```

## `.video.json` フォーマット

```json
{
  "input": "./showcase.slide.json",
  "voicevox": {
    "url": "http://localhost:50021",
    "speaker": 3,
    "speed": 1.0
  },
  "fps": 30,
  "defaultSlideDuration": 5,
  "slides": [
    {
      "slideIndex": 0,
      "narration": "こんにちは、今日はSlidiniについて紹介します。",
      "duration": null
    },
    {
      "slideIndex": 1,
      "narration": "Slidiniは、JSONベースのプレゼンテーションツールです。",
      "duration": null
    },
    {
      "slideIndex": 2,
      "duration": 8
    }
  ],
  "bgm": [
    {
      "src": "./bgm/intro.mp3",
      "volume": 0.15,
      "fromSlide": 0,
      "toSlide": 2,
      "loop": true,
      "fadeIn": 1,
      "fadeOut": 2
    }
  ]
}
```

## フィールド一覧

| フィールド | 説明 |
|-----------|------|
| `input` | ソースとなる `.slide.json` のパス |
| `voicevox` | VOICEVOX エンジンの接続設定 (省略可) |
| `fps` | フレームレート (デフォルト: 30) |
| `defaultSlideDuration` | ナレーションがないスライドのデフォルト表示秒数 |
| `slides[].narration` | VOICEVOX で読み上げるテキスト (`audioFile` と排他) |
| `slides[].audioFile` | 事前録音した音声ファイルのパス (`narration` と排他) |
| `slides[].duration` | 表示時間の明示指定 (秒)。`null` = 音声の長さに合わせて自動算出 |
| `bgm[].src` | BGM ファイルのパス |
| `bgm[].volume` | 音量 (0–1、デフォルト: 0.15) |
| `bgm[].loop` | ループ再生 (デフォルト: true) |
| `bgm[].fadeIn / fadeOut` | フェード秒数 |
| `bgm[].fromSlide / toSlide` | スライドインデックスによる再生範囲 |
| `bgm[].fromTime / toTime` | 秒数による再生範囲 |

## アーキテクチャ

```
src/
  index.ts              # CLI エントリポイント
  config.ts             # Zod スキーマ + VideoConfig 型
  cli.ts                # コマンドライン引数パーサー
  render.ts             # 3 フェーズの統合オーケストレーション
  audio/
    prepare.ts          # ナレーション合成 + スライド時間算出
    ffmpeg.ts           # FFmpeg プロセス起動 + フィルタチェーン構築
  capture/
    server.ts           # Vite 開発サーバー起動
    browser.ts          # Puppeteer + timeweb セットアップ
    pipeline.ts         # フレーム単位のキャプチャループ
  voicevox/
    client.ts           # VOICEVOX HTTP クライアント (音声合成 + WAV 解析)
```
