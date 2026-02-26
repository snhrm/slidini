# @slidini/app

ブラウザで動作するプレゼンテーションエディタUI。

## 開発

```bash
bun run dev      # 開発サーバー起動
bun run build    # プロダクションビルド
bun run preview  # ビルド結果のプレビュー
```

## 構成

### コンポーネント (`src/components/`)

| ファイル | 説明 |
|---------|------|
| `Editor.tsx` | メインレイアウト（サイドバー + キャンバス + プロパティパネル） |
| `Canvas.tsx` | `<Presentation>` のラッパー。要素の選択・更新をストアに橋渡し |
| `Toolbar.tsx` | 上部ツールバー（要素追加、ファイル入出力、表示モード切替） |
| `SlideList.tsx` | 左サイドバー（スライドサムネイル、並べ替え、追加・削除） |
| `PropertyPanel.tsx` | 右サイドバー（位置/サイズ、テキストスタイル、グラフ設定、アニメーション等） |
| `TemplatePicker.tsx` | テンプレート選択モーダル |
| `ColorSetPicker.tsx` | カラーセット選択モーダル |

### 状態管理 (`src/store/`)

Zustandストアで以下を管理:

- プレゼンテーションデータ (`presentation`)
- 選択状態 (`currentSlideIndex`, `currentStep`, `selectedElementId`)
- 表示モード (`viewMode`, `autoplayConfig`, `autoplayState`)
- スライド/要素のCRUD操作
- オーバーレイ要素の操作
- JSON入出力 (`exportJson`, `importJson`)

### ユーティリティ (`src/utils/`)

- `file.ts` — JSON/画像/動画ファイルの読み書き（Base64エンコード）

## 技術スタック

- **React 19** + **Vite** — ビルド・開発サーバー
- **Tailwind CSS** — UIスタイリング
- **Zustand** — 状態管理
- **@slidini/renderer** — プレゼンテーション描画
- **@slidini/templates** — テンプレート・カラーセット
