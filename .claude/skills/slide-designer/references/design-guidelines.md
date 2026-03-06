# Design Guidelines

Visual hierarchy and design principles for slide generation.

## Canvas Specifications

| Property | Value |
|----------|-------|
| Width | 1920 px |
| Height | 1080 px |
| Aspect Ratio | 16:9 |
| Margin (horizontal) | 100 px from edges |
| Margin (vertical) | 50 px from edges |
| Safe area | 100-1820 (x), 50-1030 (y) |

## Core Principles

### 1. Fill the Canvas

**余白を無駄にしない。** コンテンツ領域はキャンバスを最大限に活用する。

- タイトルは y=50 から開始し、上部の無駄な空白を排除
- ボディは y=220 からタイトル直下に配置し、下端 y=1000 付近まで使う
- 左右マージンは 100px に抑え、コンテンツ幅を最大化

### 2. Readable Type Sizes

**遠くからでも読める文字サイズ。** プレゼンテーションは大画面で表示される前提。

- ボディテキストは最低 36px（title-body）
- 箇条書きは最低 32px
- 28px 未満のテキストは使わない（キャプション・属性表記のみ例外）

### 3. No Text Clipping

**文字の見切れは絶対に防ぐ。** 要素の height はコンテンツ量に応じて必ず調整する。

```
必要な高さ = 行数 × fontSize × lineHeight + padding × 2 + 10
```

- **`padding × 2`**: `style.padding` は上下両方に適用される。バッジ（`backgroundColor` 付きテキスト）では特に重要
- Markdown の箇条書きは1項目＝最低1行。長い項目は折り返し行数も加算
- コードブロックの各行もカウント対象

例: padding=14, fontSize=32, lineHeight=1.5 の1行テキスト：
```
1行 × 32px × 1.5 + 14 × 2 + 10 = 86px → height: 86 以上
```

例: padding=0, fontSize=36, lineHeight=1.7 の5項目箇条書き（各2行）：
```
5項目 × 2行 × 36px × 1.7 + 0 + 10 = 622px → height: 650 以上
```

## Visual Hierarchy

| Principle | Description |
|-----------|-------------|
| Focal Point | ONE dominant element per slide draws attention first |
| Size Contrast | Headlines 1.5-2x larger than body text |
| Breathing Room | Minimum 100px margin from horizontal edges, 50px from vertical |
| Alignment | Consistent left alignment for content slides, center for titles |
| Z-Index | Higher z-index for elements that should appear on top |

## Color Application

### ColorSet Role Mapping

| Role | Usage | Typical Element |
|------|-------|-----------------|
| `background` | Slide background | Slide background color |
| `surface` | Cards, accent backgrounds | Text element backgroundColor |
| `textPrimary` | Headlines, main text | Title text color |
| `textSecondary` | Body text, bullets | Body text color |
| `textMuted` | Captions, attributions | Small/secondary text color |
| `accent` | Emphasis, primary highlight | Section headers bg, gradient start, key-stat number |
| `accentSecondary` | Secondary highlight | Comparison headers bg, gradient end |

### Background Strategy

| Slide Type | Background |
|------------|------------|
| Cover | Gradient (accent → accentSecondary) |
| Content | Solid (background color) |
| Section divider | Gradient (accent → accentSecondary) |
| Quote | Solid (background color) |
| Key stat | Solid (background color) or slightly different (surface) |
| Closing | Gradient (match cover) or solid |

## Typography Hierarchy

| Level | fontSize | fontWeight | Color Role | Usage |
|-------|----------|------------|------------|-------|
| Display | 80 | bold | textPrimary | Cover title only |
| H1 | 64 | bold | textPrimary | Section divider |
| H2 | 52 | bold | textPrimary | Slide title |
| H3 | 40 | bold | textPrimary | Subtitle, sub-headings |
| Body | 36 | normal | textSecondary | Main body text |
| Small | 32 | normal | textSecondary | Bullet points, column text |
| Caption | 28 | normal | textMuted | Attributions, notes |
| Stat | 140-180 | bold | accent | Large statistics |

## Animation Guidelines

### When to Add Animations

| Element Type | Animation | Recommendation |
|-------------|-----------|----------------|
| Cover title | fade-in | Always |
| Cover subtitle | fade-in (delayed) | Always |
| Slide title | None | Default (skip) |
| Body content | fade-in | Optional, for emphasis |
| Key stat number | scale-in | Recommended |
| Quote text | fade-in | Recommended |

### Animation Defaults

```
duration: 0.5s
delay: 0.2s (increment by 0.15s for sequential elements)
easing: ease-out
trigger: onEnter
stepIndex: 0 (always visible)
```

### Progressive Reveal

Use `stepIndex > 0` sparingly:
- Good: Revealing 3 key points one by one in a title-body slide
- Good: Revealing comparison columns sequentially
- Bad: Every element on every slide has a stepIndex

## Transition Guidelines

| Context | Transition | Duration |
|---------|------------|----------|
| Default | `fade` | 0.5s |
| Section change | `fade` | 0.5s |
| Forward flow | `slide-left` | 0.5s |
| Emphasis moment | `zoom` | 0.4s |
| Cover → Content | `fade` | 0.6s |

## Consistency Rules

| Element | Guideline |
|---------|-----------|
| Margins | Same horizontal (100px) and vertical (50px) margins on all slides |
| Title position | Same x,y position for all title-body slides |
| Font sizes | Same size for same content type across all slides |
| Colors | Use only colors from the selected ColorSet |
| Transitions | Use the same transition type for all content slides |

## Content Density by Slide Type

| Type | Max Text Elements | Max Bullet Points | Notes |
|------|-------------------|-------------------|-------|
| Cover | 2 (title + subtitle) | 0 | Keep minimal |
| Content | 2 (title + body) | 5 | Each bullet 2-3 lines with detail |
| Two-column | 3 (title + 2 cols) | 4 per column | Balance both sides |
| Comparison | 5 (title + 2 headers + 2 bodies) | 4 per side | Keep parallel |
| Section divider | 1 | 0 | Section name only |
| Quote | 2 (quote + attribution) | 0 | Let quote breathe |
| Key stat | 3 (number + label + context) | 0 | One number dominates |
| Closing | 2 (message + subtext) | 0 | Impactful and clean |
