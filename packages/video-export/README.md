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

## `playback` 設定（`.slide.json` 内）

再生・動画エクスポート設定は `.slide.json` の `playback` フィールドに統合されている。

```json
{
  "meta": { "..." : "..." },
  "slides": [ "..." ],
  "playback": {
    "defaultSlideDuration": 5,
    "defaultStepDelay": 1,
    "slides": [
      {
        "slideIndex": 0,
        "narration": "こんにちは、今日はスリディーニについて紹介します。",
        "audioFile": "./audio/slide-00.wav",
        "duration": null
      },
      {
        "slideIndex": 1,
        "narration": "スリディーニは、ジェイソンベースのプレゼンテーションツールです。",
        "audioFile": "./audio/slide-01.wav",
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
        "loop": true,
        "fadeIn": 1,
        "fadeOut": 2
      }
    ]
  }
}
```

## フィールド一覧

| フィールド | 説明 |
|-----------|------|
| `playback.defaultSlideDuration` | ナレーションがないスライドのデフォルト表示秒数 |
| `playback.defaultStepDelay` | ステップ間のデフォルト遅延秒数 |
| `playback.slides[].narration` | VOICEVOX で読み上げるテキスト (`audioFile` と排他) |
| `playback.slides[].audioFile` | 事前録音した音声ファイルのパス (`narration` と排他) |
| `playback.slides[].duration` | 表示時間の明示指定 (秒)。`null` = 音声の長さに合わせて自動算出 |
| `playback.bgm[].src` | BGM ファイルのパス |
| `playback.bgm[].volume` | 音量 (0–1、デフォルト: 0.15) |
| `playback.bgm[].loop` | ループ再生 (デフォルト: true) |
| `playback.bgm[].fadeIn / fadeOut` | フェード秒数 |
| `playback.bgm[].startTime / endTime` | 秒数による再生範囲 |

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
