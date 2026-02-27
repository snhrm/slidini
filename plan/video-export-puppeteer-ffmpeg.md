# スライド動画エクスポート: Puppeteer + FFmpeg アプローチ

## Context

`.slide.json` から VOICEVOX ナレーション + BGM 付き MP4 動画を CLI で生成する。
Remotion を使わず、**既存の Framer Motion レンダラーをそのまま活用**する。

核心: ブラウザの時間 API を仮想化 (timeweb) → Puppeteer でフレーム単位キャプチャ → FFmpeg で映像 + 音声をエンコード。
既存の 19 トランジション・24 アニメーション・stepIndex フラグメントが全て再実装なしで動作する。

## Remotion を使わない理由

| 観点 | Remotion | Puppeteer + FFmpeg |
|------|----------|-------------------|
| 既存レンダラー | 再利用不可 (Framer Motion 非対応) | **そのまま再利用** |
| トランジション | 19種を全て再実装 | **再実装不要** |
| 要素アニメーション | 24種を全て再実装 | **再実装不要** |
| バンドラー | Webpack 別系統が必要 | Vite をそのまま使用 |
| 依存サイズ | remotion + 6 サブパッケージ | puppeteer + ffmpeg-static |
| 音声統合 | React コンポーネント内で宣言的 | FFmpeg で後処理 (より柔軟) |

## 処理フロー

```
.slide.json
    ↓
Phase 1: 音声生成
    VOICEVOX → slide-001.wav, slide-002.wav, ... + 各尺を計算
    ↓
Phase 2: フレームキャプチャ
    Vite dev server 起動 (export 用ミニアプリ)
    → Puppeteer で開く (timeweb 注入で時間仮想化)
    → ExportPlayer が setTimeout で スライド/ステップ を自動進行
    → フレームごとに: 仮想時間を進める → screenshot → FFmpeg stdin にパイプ
    ↓
Phase 3: エンコード
    FFmpeg: フレーム列 (image2pipe) + ナレーション WAV (adelay で時刻指定) + BGM → MP4
    ↓
output.mp4
```

## パッケージ構成

新規 `packages/video-export` (`@slidini/video-export`):

```
packages/video-export/
  package.json
  tsconfig.json
  export-app/                          # Puppeteer が開くミニ React アプリ
    index.html                         # Google Fonts プリロード付き
    vite.config.ts                     # 最小限の Vite 設定
    src/
      main.tsx                         # ReactDOM.render(<ExportPlayer>)
      ExportPlayer.tsx                 # 既存 <Presentation> のラッパー (タイムライン制御)
  src/
    index.ts                           # CLI エントリポイント
    cli.ts                             # parseArgs による引数解析
    config.ts                          # VideoExportConfig 型
    voicevox/
      client.ts                        # fetch ベース VOICEVOX API クライアント
    capture/
      server.ts                        # Vite dev server のプログラマティック起動
      browser.ts                       # Puppeteer + timeweb セットアップ
      pipeline.ts                      # フレームキャプチャ → FFmpeg パイプ
    audio/
      prepare.ts                       # スライドごと WAV 生成 + 尺計算
      ffmpeg.ts                        # FFmpeg コマンド組み立て + 実行
    render.ts                          # 全体オーケストレーション
```

## 依存関係

```json
{
  "dependencies": {
    "@slidini/core": "workspace:*",
    "@slidini/renderer": "workspace:*",
    "puppeteer": "^24.x",
    "timeweb": "^0.3.x"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.x",
    "vite": "^6.x",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

FFmpeg は `ffmpeg-static` (npm) またはシステムの ffmpeg を使用。

## データモデル変更

### `packages/core/src/types.ts`

```typescript
export type Slide = {
  // ... existing fields ...
  speakerNotes?: string | null  // NEW: VOICEVOX ナレーション用テキスト
}
```

### `packages/core/src/schema.ts`

```typescript
const slideSchema = z.object({
  // ... existing fields ...
  speakerNotes: z.string().nullable().optional(),
})
```

後方互換性あり（optional）。

## 技術的な仕組み: timeweb による時間仮想化

### なぜ必要か

Framer Motion は `requestAnimationFrame` と `performance.now()` を使ってアニメーションを駆動する。
通常の Puppeteer スクリーンショットでは、キャプチャに数百ms かかる間にもアニメーションが進行してしまい、フレーム落ちが発生する。

### timeweb の動作原理

timeweb はブラウザの全時間 API を仮想タイムラインで置き換える:

- `performance.now()` → 仮想時間を返す
- `Date.now()` / `new Date()` → 仮想時間を返す
- `requestAnimationFrame` → `goTo()` 呼び出し時に1回だけコールバックを実行
- `setTimeout` / `setInterval` → 仮想時間ベースで発火

```
通常: 実時間が経過 → rAF が発火 → アニメーション更新 (フレーム落ちあり)
仮想: goTo(time) 呼出 → rAF が1回発火 → アニメーション更新 → スクリーンショット (確実に全フレーム取得)
```

### Framer Motion との相性

Framer Motion はアニメーションを以下のように駆動:
1. `requestAnimationFrame` でループ
2. `performance.now()` で現在時刻を取得
3. 開始時刻との差分からアニメーション進捗を計算
4. inline style を更新

timeweb が 1, 2 を仮想化するため、Framer Motion は仮想時間に基づいて正確にアニメーション状態を計算する。
CSS Animations は使っていないため（全て JS + inline style）、この手法で完全にカバーできる。

## ExportPlayer コンポーネント

`export-app/src/ExportPlayer.tsx` - 既存 `<Presentation>` を制御するラッパー:

```tsx
// 既存の <Presentation> コンポーネントをそのまま使用
// 外部から注入されるタイムライン設定に基づいてスライド/ステップを自動進行

function ExportPlayer() {
  // window.__EXPORT_CONFIG__ から設定を取得
  // (Puppeteer が page.evaluateOnNewDocument で注入)
  const config = window.__EXPORT_CONFIG__
  // config: { presentation, slideTiming: { durationMs, steps }[] }

  const [currentSlide, setCurrentSlide] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  // setTimeout ベースの自動進行 (timeweb が仮想化する)
  useEffect(() => {
    const timing = config.slideTiming[currentSlide]
    if (!timing) return

    const maxStep = timing.steps
    if (currentStep < maxStep) {
      // ステップ間隔 = スライド表示時間 / (ステップ数 + 1)
      const stepInterval = timing.durationMs / (maxStep + 1)
      const timer = setTimeout(() => setCurrentStep(s => s + 1), stepInterval)
      return () => clearTimeout(timer)
    }

    // 最終ステップに達したら次スライドへ
    const remaining = timing.durationMs - (timing.durationMs / (maxStep + 1)) * maxStep
    const timer = setTimeout(() => {
      setCurrentSlide(s => s + 1)
      setCurrentStep(0)
    }, remaining)
    return () => clearTimeout(timer)
  }, [currentSlide, currentStep, config])

  // フォント読み込み完了を通知
  useEffect(() => {
    document.fonts.ready.then(() => {
      window.__EXPORT_READY__ = true
    })
  }, [])

  // 全スライド完了を通知
  if (currentSlide >= config.slideTiming.length) {
    window.__EXPORT_DONE__ = true
    return null
  }

  return (
    <div style={{ width: meta.width, height: meta.height }}>
      <Presentation
        data={config.presentation}
        currentSlide={currentSlide}
        currentStep={currentStep}
        viewMode="single"
        mode="view"
        onSlideChange={setCurrentSlide}
        onStepChange={setCurrentStep}
      />
    </div>
  )
}
```

ポイント:
- `viewMode="single"` + `mode="view"` で表示専用モード
- setTimeout は timeweb により仮想化されるため、フレームキャプチャと同期
- スケーリング不要 (Puppeteer のビューポートを 1920x1080 に設定)
- 既存の `<Presentation>` がトランジション・アニメーション・overlay を全て処理

## フレームキャプチャ

`src/capture/browser.ts`:

```typescript
import puppeteer from 'puppeteer'

// 1. Puppeteer 起動 (1920x1080 ビューポート)
const browser = await puppeteer.launch({ headless: 'shell' })
const page = await browser.newPage()
await page.setViewport({ width: 1920, height: 1080 })

// 2. timeweb 注入 (全時間 API を仮想化)
await page.evaluateOnNewDocument(timewebScript)

// 3. エクスポート設定注入
await page.evaluateOnNewDocument((config) => {
  window.__EXPORT_CONFIG__ = config
}, exportConfig)

// 4. ページ読み込み + フォント待機
await page.goto(`http://localhost:${vitePort}`)
await page.waitForFunction(() => window.__EXPORT_READY__)

// 5. フレームループ
const frameDuration = 1000 / fps  // ms
let currentTime = 0

while (!(await page.evaluate(() => window.__EXPORT_DONE__))) {
  // 仮想時間を 1 フレーム分進める
  await page.evaluate((ms) => timeweb.goTo(ms), currentTime)

  // スクリーンショット → FFmpeg stdin にパイプ
  const buffer = await page.screenshot({ type: 'png' })
  ffmpegStdin.write(buffer)

  currentTime += frameDuration
}

ffmpegStdin.end()
```

### バックプレッシャー制御

FFmpeg の stdin が詰まった場合の対処:

```typescript
const canContinue = ffmpegStdin.write(buffer)
if (!canContinue) {
  await new Promise(resolve => ffmpegStdin.once('drain', resolve))
}
```

## 音声ミキシング (FFmpeg)

`src/audio/ffmpeg.ts`:

```typescript
// 全ナレーション WAV + BGM を1つのコマンドで合成
function buildFFmpegArgs(
  slideAudios: { wavPath: string; startTimeMs: number }[],
  bgmPath: string | undefined,
  bgmVolume: number,
  outputPath: string
): string[] {
  const args = [
    '-y',
    '-framerate', String(fps),
    '-f', 'image2pipe', '-c:v', 'png', '-i', '-',  // stdin: フレーム列
  ]

  // BGM 入力
  if (bgmPath) {
    args.push('-stream_loop', '-1', '-i', bgmPath)  // ループ再生
  }

  // 各スライドのナレーション入力
  for (const audio of slideAudios) {
    args.push('-i', audio.wavPath)
  }

  // filter_complex: 音量調整 + 時刻オフセット + ミキシング
  const filters = []
  const mixInputs = []
  let idx = 1

  if (bgmPath) {
    filters.push(`[${idx}:a]volume=${bgmVolume}[bgm]`)
    mixInputs.push('[bgm]')
    idx++
  }

  for (const audio of slideAudios) {
    const label = `n${idx}`
    const delay = Math.round(audio.startTimeMs)
    filters.push(`[${idx}:a]adelay=${delay}|${delay}[${label}]`)
    mixInputs.push(`[${label}]`)
    idx++
  }

  filters.push(
    `${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=first:dropout_transition=0[aout]`
  )

  args.push(
    '-filter_complex', filters.join(';'),
    '-map', '0:v', '-map', '[aout]',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18',
    '-c:a', 'aac', '-b:a', '192k',
    '-shortest',
    outputPath
  )

  return args
}
```

各ナレーション WAV は `adelay` で正確なタイムスタンプに配置。BGM は `-stream_loop -1` でループ + `volume` で減衰。

## VOICEVOX クライアント

`src/voicevox/client.ts` - 依存ライブラリなし (raw fetch):

```typescript
export class VoicevoxClient {
  constructor(private baseUrl = "http://localhost:50021") {}

  // Step 1: テキスト → AudioQuery (読み・アクセント・タイミング情報)
  async createAudioQuery(text: string, speakerId: number): Promise<AudioQuery>

  // Step 2: AudioQuery → WAV Buffer (24kHz/16bit/mono)
  async synthesis(query: AudioQuery, speakerId: number): Promise<Buffer>

  // 一括: テキスト → WAV (speedScale, pitchScale 等のオーバーライド可)
  async synthesize(text: string, speakerId: number, overrides?: Partial<AudioQuery>): Promise<Buffer>

  // WAV ヘッダーパースで尺を算出
  getWavDuration(wavBuffer: Buffer): number
}
```

前提: VOICEVOX エンジンが `localhost:50021` で起動済み

### 話者例

| キャラクター | スタイル | ID |
|-------------|---------|-----|
| ずんだもん | ノーマル | 3 |
| 四国めたん | ノーマル | 2 |
| 春日部つむぎ | ノーマル | 8 |
| 波音リツ | ノーマル | 9 |
| No.7 | アナウンス | 30 |

## CLI インターフェース

```
bun run packages/video-export/src/index.ts [options] <input.slide.json>

Options:
  -o, --output <path>       出力パス (デフォルト: <input>.mp4)
  --fps <number>            FPS (デフォルト: 30)

  --voicevox                VOICEVOX ナレーション有効化
  --voicevox-url <url>      VOICEVOX URL (デフォルト: http://localhost:50021)
  --speaker <id>            話者 ID (デフォルト: 3 = ずんだもん)
  --speed <number>          話速 (デフォルト: 1.0)

  --bgm <path>              BGM ファイルパス
  --bgm-volume <0-1>        BGM 音量 (デフォルト: 0.15)

  --slide-duration <sec>    ナレーションなし時のスライド表示秒数 (デフォルト: 5)
```

## 変更が必要なファイル

| ファイル | 変更内容 |
|---------|---------|
| `packages/core/src/types.ts` | `Slide` に `speakerNotes?: string \| null` 追加 |
| `packages/core/src/schema.ts` | `slideSchema` に `speakerNotes` 追加 |
| `package.json` (root) | video-export スクリプト追加 |
| `packages/video-export/` | **新規パッケージ全体** |

既存の renderer/app パッケージは変更なし。

## 実装フェーズ

### Phase 1: MVP (静的スライド + 基本キャプチャ)
1. パッケージ構造作成
2. `@slidini/core` に `speakerNotes` 追加
3. ExportPlayer コンポーネント (スライド自動進行、ステップ進行なし)
4. Vite dev server のプログラマティック起動
5. Puppeteer + timeweb でフレームキャプチャ
6. FFmpeg で PNG 列 → MP4 (音声なし)
7. `samples/showcase.slide.json` でテスト

### Phase 2: VOICEVOX ナレーション
1. VOICEVOX クライアント実装
2. 音声準備パイプライン (WAV 生成 + 尺計算)
3. スライド尺をナレーション長に合わせる
4. FFmpeg で映像 + ナレーション WAV の合成

### Phase 3: BGM + ステップ進行
1. BGM ミキシング (FFmpeg adelay + amix)
2. stepIndex フラグメントの自動時間分割
3. BGM フェードイン/フェードアウト

### Phase 4: 仕上げ
1. エラーハンドリング (VOICEVOX 未起動、FFmpeg 未インストール等)
2. 進捗表示 (フレーム数/合計)
3. ナレーションなしスライドのデフォルト尺設定
4. 一時ファイルのクリーンアップ

## 検証方法

1. `samples/showcase.slide.json` に `speakerNotes` を追加したテスト用ファイルを作成
2. VOICEVOX Docker 起動: `docker run --rm -p 50021:50021 voicevox/voicevox_engine:cpu-latest`
3. CLI 実行:
   ```bash
   bun run packages/video-export/src/index.ts \
     --voicevox --speaker 3 \
     --bgm path/to/bgm.mp3 --bgm-volume 0.1 \
     -o output.mp4 \
     samples/showcase.slide.json
   ```
4. 出力 MP4 で確認:
   - 各スライドがナレーション音声と同期して切り替わるか
   - 既存のトランジション (fade, slide, cube 等) が正しく動くか
   - 要素アニメーション (fade-in, bounce-in 等) が正しく動くか
   - BGM が低音量でループ再生されるか
   - フォントが正しく表示されるか
