# スライド動画エクスポート: Remotion アプローチ

## Context

スライドプレゼンテーション (.slide.json) から、VOICEVOX によるナレーション音声と BGM を合成した MP4 動画を CLI で生成する機能を追加する。既存の Framer Motion ベースのレンダラーは Remotion のフレームベースレンダリングと互換性がないため、Remotion 専用のスライドレンダリングコンポーネントを新規作成する。

## 処理フロー

```
.slide.json → テキスト抽出 → VOICEVOX で WAV 生成 → 尺計算
                                                        ↓
                                            Remotion Composition 構築
                                            (スライド + トランジション + 音声 + BGM)
                                                        ↓
                                            bundle() → renderMedia() → MP4
```

## パッケージ構成

新規 `packages/video-export` (`@slidini/video-export`) を追加:

```
packages/video-export/
  package.json
  tsconfig.json
  src/
    index.ts                          # CLI エントリポイント
    cli.ts                            # parseArgs による引数解析 + オーケストレーション
    config.ts                         # VideoExportConfig 型 + デフォルト値
    voicevox/
      client.ts                       # fetch ベースの VOICEVOX API クライアント
    audio/
      prepare.ts                      # スライドごとのナレーション WAV 生成 + 尺計算
    remotion/
      index.ts                        # registerRoot エントリポイント
      Root.tsx                        # Composition 登録
      SlideVideo.tsx                  # TransitionSeries による全体構成
      SlideScene.tsx                  # 単一スライドの描画 (背景 + 要素 + Audio)
      components/
        SlideBackground.tsx           # 背景 (color/image/gradient) - 純 CSS
        TextElement.tsx               # react-markdown + remark-gfm
        ImageElement.tsx              # <img>
        ChartElement.tsx              # recharts (renderer の renderChart ロジックを流用)
        ElementWrapper.tsx            # position/size/rotation/opacity + アニメーション適用
      transitions/
        mapping.ts                    # SlideTransitionType → Remotion presentation マッピング
        custom-presentations.ts       # カスタム presentations (zoom, rotate, scale-fade, cube, portal 等)
      animations/
        mapping.ts                    # AnimationType → interpolate()/spring() パラメータ
        apply.ts                      # useCurrentFrame() ベースのスタイル計算
    render.ts                         # bundle → selectComposition → renderMedia パイプライン
```

## 依存関係

```json
{
  "dependencies": {
    "@slidini/core": "workspace:*",
    "remotion": "4.x",
    "@remotion/bundler": "4.x",
    "@remotion/renderer": "4.x",
    "@remotion/transitions": "4.x",
    "@remotion/media": "4.x",
    "@remotion/google-fonts": "4.x",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-markdown": "^10.1.0",
    "remark-gfm": "^4.0.1",
    "recharts": "^3.7.0"
  }
}
```

注: Remotion は内部で Webpack を使用（Vite とは別系統、衝突なし）

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

後方互換性あり（optional フィールド）。

## VOICEVOX クライアント

`src/voicevox/client.ts` - 依存ライブラリなし、raw fetch:

- `createAudioQuery(text, speakerId)` → POST `/audio_query`
- `synthesis(query, speakerId)` → POST `/synthesis` → WAV Buffer
- `synthesize(text, speakerId, overrides?)` → 2ステップを一括実行
- WAV ヘッダーパースによる尺計算

前提: VOICEVOX エンジンが `localhost:50021` で起動済み（Docker or デスクトップアプリ）

## トランジションマッピング

`src/remotion/transitions/mapping.ts`:

| Slidini | Remotion 実装 |
|---------|--------------|
| `none` | トランジションなし |
| `fade` | `fade()` |
| `slide-left/right/up/down` | `slide({ direction })` |
| `wipe-left/right/up/down` | `wipe({ direction })` |
| `flip-x/y` | `flip({ direction })` |
| `portal` | `iris({ width, height })` |
| `zoom` | カスタム: scale + opacity interpolation |
| `scale-fade` | カスタム: scale(0.8→1→1.2) + opacity |
| `rotate` | カスタム: rotate + scale + opacity |
| `cube-left/right/up/down` | カスタム: perspective + rotateY/rotateX (Remotion の custom presentation API) |
| `page-turn` | カスタム: rotateY + transformOrigin:left |

カスタム presentations は `TransitionPresentationComponentProps` を実装し、`presentationProgress` (0→1) で CSS transform を駆動。

## 要素アニメーションマッピング

`src/remotion/animations/mapping.ts`:

既存 24 種を Remotion の `interpolate()` / `spring()` で再実装:

- **直接マッピング** (interpolate): fade-in/out, slide-in/out-*, scale-in/out, rotate-in/out, flip-in/out
- **Spring ベース** (spring): bounce-in/out (stiffness:400/damping:15), elastic-in/out (stiffness:200/damping:8), drop-in/out (stiffness:300/damping:20)
- **ループ** (frame % loopFrames): float (y:[0,-20,0], 3秒周期), pulse (scale:[1,1.06,1], 2秒周期)

### stepIndex (フラグメント) の動画モードでの扱い

インタラクティブモードではクリックで step が進行するが、動画では自動進行:
- スライドの表示時間を step 数で等分
- 例: 3ステップ、9秒のスライド → step0=0s, step1=3s, step2=6s

## Remotion 構成

### SlideVideo.tsx (トップレベル)

```tsx
<>
  <TransitionSeries>
    {slides.map((slide, i) => (
      <Fragment key={slide.id}>
        {/* i > 0 でトランジション挿入 */}
        {i > 0 && slide.transition.type !== "none" && (
          <TransitionSeries.Transition
            presentation={mapTransition(slide.transition, width, height)}
            timing={linearTiming({
              durationInFrames: Math.round(slide.transition.duration * fps)
            })}
          />
        )}
        <TransitionSeries.Sequence durationInFrames={slideDurations[i]}>
          <SlideScene slide={slide} meta={meta} audioSrc={audioMap[slide.id]} />
        </TransitionSeries.Sequence>
      </Fragment>
    ))}
  </TransitionSeries>
  {/* BGM レイヤー (全体にループ再生、低音量) */}
  {bgmSrc && <Audio src={bgmSrc} volume={bgmVolume} loop />}
</>
```

### スライド尺の決定

1. `speakerNotes` あり → VOICEVOX 音声の長さ + pauseBetweenSlides (デフォルト 0.5秒)
2. `speakerNotes` なし → defaultSlideDuration (デフォルト 5秒)
3. 最低 minSlideDuration (デフォルト 3秒) を保証

### レンダリングパイプライン (`render.ts`)

1. `.slide.json` 読み込み + `parsePresentation()` バリデーション
2. VOICEVOX でスライドごとの WAV を tmpdir に生成
3. 各 WAV の尺を計算 → `durationInFrames` 算出
4. `bundle()` で Remotion エントリポイントをバンドル
5. `selectComposition()` で inputProps + calculateMetadata 適用
6. `renderMedia()` で MP4 出力
7. tmpdir クリーンアップ

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

## 再利用するもの

| リソース | パス | 用途 |
|---------|------|------|
| `parsePresentation()` | `core/src/schema.ts` | .slide.json バリデーション |
| 型定義全般 | `core/src/types.ts` | Presentation, Slide, SlideElement 等 |
| `backgroundToStyle()` ロジック | `renderer/src/components/Slide.tsx:34-55` | 背景の CSS 生成（コピーして流用） |
| `getShapeStyle()` ロジック | `renderer/src/components/Slide.tsx:57-72` | スライド形状クリッピング（コピーして流用） |
| Animation 定義の参照 | `renderer/src/hooks/useAnimation.ts` | Remotion 版アニメーション実装の参照元 |
| Transition 定義の参照 | `renderer/src/hooks/useSlideTransition.ts` | Remotion 版トランジション実装の参照元 |

react-markdown, remark-gfm, recharts は同じバージョンを依存に追加してそのまま使用。

## 実装フェーズ

### Phase 1: MVP (静的スライド + VOICEVOX ナレーション + BGM)
1. パッケージ構造作成 (`package.json`, `tsconfig.json`)
2. `@slidini/core` に `speakerNotes` フィールド追加
3. VOICEVOX クライアント実装
4. 音声準備パイプライン (WAV 生成 + 尺計算)
5. Remotion コンポーネント: SlideBackground, TextElement, ImageElement, ElementWrapper (アニメーションなし)
6. SlideScene + SlideVideo (トランジションは fade のみ)
7. CLI + レンダリングパイプライン
8. `samples/showcase.slide.json` でテスト

### Phase 2: 全トランジション対応
1. 直接マッピング (slide, wipe, flip, iris)
2. カスタム presentations (zoom, rotate, scale-fade, cube-*, page-turn, portal)
3. トランジション duration/easing の適用

### Phase 3: 要素アニメーション
1. interpolate() ベースのアニメーション (fade, slide, scale, rotate, flip)
2. spring() ベースのアニメーション (bounce, elastic, drop)
3. ループアニメーション (float, pulse)
4. stepIndex フラグメントの時間分割

### Phase 4: 仕上げ
1. ChartElement (recharts)
2. overlay 要素対応
3. Google Fonts 読み込み (`@remotion/google-fonts`)
4. BGM フェードイン/フェードアウト
5. エラーハンドリング、進捗表示

## 検証方法

1. `samples/showcase.slide.json` に `speakerNotes` を追加したテスト用ファイルを作成
2. VOICEVOX Docker を起動: `docker run --rm -p 50021:50021 voicevox/voicevox_engine:cpu-latest`
3. CLI 実行:
   ```bash
   bun run packages/video-export/src/index.ts \
     --voicevox --speaker 3 \
     --bgm path/to/bgm.mp3 --bgm-volume 0.1 \
     -o output.mp4 \
     samples/showcase.slide.json
   ```
4. 出力 MP4 を再生して確認:
   - 各スライドがナレーション音声と同期して切り替わるか
   - BGM が低音量でループ再生されるか
   - トランジションが正しく適用されるか
   - テキスト・画像が正しくレンダリングされるか
