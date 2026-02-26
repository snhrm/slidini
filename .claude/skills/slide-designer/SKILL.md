---
name: slide-designer
description: Generates complete slide deck JSON files (.slide.json) for the slidini app from content input. Creates structured, editable presentations with text elements, backgrounds, transitions, animations, and optional AI-generated images via Gemini CLI. Use when user asks to "create slides", "make a presentation", "generate a deck", "スライドを作って", or "プレゼン作成".
---

# Slide Designer

Transform content into structured, editable slide deck JSON files for the slidini app, with optional AI image generation via Gemini CLI.

## Overview

This skill generates `.slide.json` files that conform to the `@slidini/core` Presentation schema. Output is fully editable in the slidini editor.

Two generation modes:
- **Text-only** (default): Structured slides with Markdown text elements
- **With images** (`--with-images`): Adds AI-generated illustrations via Gemini CLI

## Usage

```
/slide-designer path/to/content.md
/slide-designer path/to/content.md --color-set light-clean
/slide-designer path/to/content.md --slides 10
/slide-designer path/to/content.md --with-images
/slide-designer path/to/content.md --with-images --image-style watercolor
/slide-designer path/to/content.md --outline-only
/slide-designer  # Then paste content
```

## Options

| Option | Description |
|--------|-------------|
| `--color-set <id>` | Color theme: `dark-slate` (default), `light-clean`, `midnight-blue`, `warm-sunset`, `forest-green`, `monochrome` |
| `--slides <number>` | Target slide count (5-25 recommended) |
| `--with-images` | Generate illustrations for slides using Gemini CLI |
| `--image-style <style>` | Image style: `flat-illustration`, `watercolor`, `sketch`, `photorealistic`, `minimalist`, `abstract`, `pixel-art` (default: `flat-illustration`) |
| `--image-slides <list>` | Which slides get images: `all`, `key`, or comma-separated numbers (default: `key`) |
| `--outline-only` | Generate outline only, skip JSON generation |
| `--lang <code>` | Output language (auto-detect by default) |

**Slide Count by Content Length**:

| Content | Slides |
|---------|--------|
| < 500 words | 5-8 |
| 500-2000 words | 8-15 |
| 2000-5000 words | 12-20 |
| > 5000 words | 15-25 |

## Color Sets

| ID | Name | Background | Best For |
|----|------|------------|----------|
| `dark-slate` | ダークスレート | #1e293b (dark blue-gray) | General, technical |
| `light-clean` | ライトクリーン | #ffffff (white) | Business, formal, print |
| `midnight-blue` | ミッドナイトブルー | #0f172a (deep navy) | Tech, architecture |
| `warm-sunset` | ウォームサンセット | #1c1917 (warm dark) | Creative, storytelling |
| `forest-green` | フォレストグリーン | #052e16 (deep green) | Nature, sustainability |
| `monochrome` | モノクロ | #18181b (near black) | Minimal, executive |

### Auto Color Set Selection

| Content Signals | Color Set |
|-----------------|-----------|
| business, corporate, formal, proposal | `light-clean` |
| technical, architecture, system, data | `midnight-blue` |
| creative, story, warm, lifestyle | `warm-sunset` |
| nature, eco, sustainability, green | `forest-green` |
| minimal, executive, simple, clean | `monochrome` |
| Default | `dark-slate` |

## Slide Layout System

The canvas is 1920x1080 pixels. Layouts are defined by element positions.

**Available Layout Patterns** (see `references/layouts.md` for full specs):

| Layout | Description | Best For |
|--------|-------------|----------|
| `title-hero` | Large centered title + subtitle | Cover slides |
| `title-body` | Top title + bullet points below | Content slides |
| `two-column` | Title + left/right text areas | Comparisons, paired info |
| `comparison` | Color-coded 2-column with headers | Before/after, pros/cons |
| `section-divider` | Gradient background + section name | Section breaks |
| `quote` | Centered italic quote + attribution | Key insights |
| `key-stat` | One large number + context text | Impact statistics |
| `three-point` | Title + 3 spaced content blocks | Features, benefits |
| `image-text` | Left image + right text (or reversed) | Feature highlights |
| `closing` | Centered closing statement | Final slide |

## Image Generation (Gemini CLI)

When `--with-images` is specified, the skill generates illustrations using Gemini CLI and embeds them as `ImageElement` in the slide JSON.

### Prerequisites

Gemini CLI must be available and configured:

```bash
# Check Gemini CLI is installed
which gemini

# API key must be set
echo $GEMINI_API_KEY
```

If Gemini CLI is not available, fall back to text-only mode with a warning.

### Image Style Options

| Style | Description | Best For |
|-------|-------------|----------|
| `flat-illustration` (default) | Clean vector-style flat illustrations | Business, tech, general |
| `watercolor` | Soft watercolor painting style | Creative, lifestyle, artistic |
| `sketch` | Hand-drawn pencil/ink sketch | Educational, informal |
| `photorealistic` | Photo-like realistic images | Product, architecture |
| `minimalist` | Simple shapes, minimal detail | Executive, clean decks |
| `abstract` | Abstract geometric/organic shapes | Conceptual, modern |
| `pixel-art` | Retro 8-bit pixel art style | Gaming, developer, fun |

### Which Slides Get Images

`--image-slides` controls which slides receive generated images:

| Value | Behavior |
|-------|----------|
| `key` (default) | Cover slide + section dividers + 1-2 key content slides |
| `all` | Every slide gets an illustration |
| `1,3,5` | Only specified slide numbers |

### Image Output

Images are saved as PNG files alongside the `.slide.json`:

```
{topic-slug}/
├── {topic-slug}.slide.json
└── images/
    ├── 01-cover.png
    ├── 03-key-finding.png
    └── 05-section-growth.png
```

### Image Element Positioning

Images are embedded as `ImageElement` in the slide JSON. Position depends on layout:

| Layout | Image Position | Image Size | Text Adjustment |
|--------|---------------|------------|-----------------|
| `title-hero` | Background (full slide) | 1920x1080 | Text overlaid with opacity |
| `image-text` | Left half | 840x840 | Text on right |
| `title-body` | Right side accent | 600x500 | Body width reduced |
| `section-divider` | Background (full, 0.3 opacity) | 1920x1080 | Text overlaid |

## Design Philosophy

Slides designed for **both presentation and reading**:
- Each slide conveys ONE clear message
- Logical flow when navigating
- Consistent visual language throughout
- Markdown content enables rich formatting
- Images enhance understanding, not distract

## Workflow

```
Text-only:    Input → Analyze → Confirm → Outline → Generate JSON → Output
With images:  Input → Analyze → Confirm → Outline → Generate JSON → Generate Images → Embed → Output
```

### Step 1: Analyze Content

1. If content is a file path, read the file
2. If no content provided, ask user to paste or describe the topic
3. Analyze:
   - Core message and supporting points (see `references/content-rules.md`)
   - Content signals for color set recommendation
   - Source language detection
   - Recommended slide count based on length
   - If `--with-images`: identify slides that benefit from illustrations
4. Generate topic slug (2-4 words, kebab-case)

### Step 2: Confirmation

**Use user's language for all communication.**

Display analysis summary, then confirm with user:

1. **Color Set**: Recommend based on content signals, let user choose
2. **Slide Count**: Recommend based on content length, let user adjust
3. **Language**: Confirm detected language
4. **Images** (if `--with-images`): Show which slides will get images and chosen style

Proceed after confirmation. If user says "proceed" or similar without specific choices, use recommended defaults.

### Step 3: Generate Outline

Create a slide-by-slide outline following `references/outline-template.md`.

**Outline Structure**:
```markdown
# Slide Deck Outline

**Topic**: [topic]
**Color Set**: [id]
**Slides**: N
**Language**: [lang]
**Images**: [yes/no] ([style])

---

## Slide 1 — Cover
- Layout: title-hero
- Headline: [title text]
- Subtitle: [subtitle text]
- Background: gradient
- Image: [description of cover illustration] ← only if --with-images

## Slide 2 — [Topic]
- Layout: title-body
- Title: [narrative title]
- Body: [bullet points]
- Transition: fade

...

## Slide N — Closing
- Layout: closing
- Message: [closing statement]
```

When `--with-images`, add `Image:` field to slides that will receive illustrations. The description should be a concise visual prompt (1-2 sentences) for Gemini.

**Content Rules** (see `references/content-rules.md`):
- Headlines tell the story, not label content
- Avoid AI cliches ("dive into", "explore", "journey")
- Each slide = one clear message
- Back cover: meaningful close, not just "Thank you"

If `--outline-only`, display outline and stop.

### Step 4: Generate JSON

Generate a complete `.slide.json` file following the Presentation schema.

**Key Schema Reference** (from `@slidini/core`):

```typescript
type Presentation = {
  meta: {
    schemaVersion: 1
    title: string
    width: 1920
    height: 1080
    createdAt: string  // ISO 8601
    updatedAt: string
    colorSetId?: string
  }
  slides: Slide[]
}

type Slide = {
  id: string           // unique, e.g. "slide-{timestamp}-{random}"
  background: Background
  transition: SlideTransition
  elements: SlideElement[]
  colorSetId?: string
}
```

**Element Generation Rules**:

1. **IDs**: Use format `{type}-{timestamp}-{random6}` (e.g., `text-1709000000000-abc123`). Each element needs a unique ID.

2. **Text Elements**: Content is Markdown format. Use `#` for titles, `##` for subtitles, `-` for bullets, `**bold**` for emphasis, `>` for quotes.

3. **Image Elements**: Used when `--with-images`. Reference local PNG file path in `src` field. Set `fit: "cover"` for backgrounds, `fit: "contain"` for illustrations.

4. **Positioning**: Use layout patterns from `references/layouts.md`. All coordinates in pixels on 1920x1080 canvas.

5. **Colors**: Apply from the selected ColorSet:
   - `background` → slide background color
   - `surface` → accent backgrounds, cards
   - `textPrimary` → headlines, main text
   - `textSecondary` → body text, bullet points
   - `textMuted` → captions, attributions
   - `accent` → emphasis elements, highlight backgrounds
   - `accentSecondary` → secondary highlights, gradient stops

6. **Transitions**: Use `fade` as default. Use `slide-left` for forward flow, `zoom` for emphasis.

7. **Animations**: Add subtle `fade-in` animations to key elements. Use `stepIndex` for progressive reveal when appropriate.

**Generation Process**:

For each slide in the outline:
1. Select layout pattern → get element positions/sizes from `references/layouts.md`
2. Create text elements with Markdown content
3. Apply colors from selected ColorSet
4. Set appropriate background (solid color or gradient for dividers)
5. Set transition (default: fade, 0.5s, ease-out)
6. Add animations where appropriate
7. If slide has `Image:` field, add placeholder ImageElement (src updated after generation)

### Step 5: Generate Images (only with `--with-images`)

See `references/image-generation.md` for full details.

**Process**:

1. Create output directory: `{topic-slug}/images/`
2. For each slide with an `Image:` field in the outline:
   a. Build the image generation prompt (see `references/image-generation.md`)
   b. Call Gemini CLI:
      ```bash
      gemini -p "[prompt]" --output-format json -y 2>/dev/null
      ```
      Or use the nanobanana MCP extension if available:
      ```bash
      gemini -p "/generate \"[prompt]\" --styles=\"[style]\"" -y 2>/dev/null
      ```
      Or call the Gemini API directly via script (see `references/image-generation.md`)
   c. Save image to `{topic-slug}/images/{NN}-{slug}.png`
   d. Update the ImageElement `src` in the JSON with the relative file path
3. Report progress: "Generated image X/N" (in user's language)
4. On failure, auto-retry once, then skip with warning

### Step 6: Output

1. If `--with-images`:
   - Create directory `{topic-slug}/`
   - Write JSON to `{topic-slug}/{topic-slug}.slide.json`
   - Images already in `{topic-slug}/images/`
2. If text-only:
   - Write JSON to `{topic-slug}.slide.json` in current directory

Display summary:

```
Slide Deck Complete!

Topic: [topic]
Color Set: [name]
File: [path]
Slides: N total
Images: M generated  ← only if --with-images

1. Cover — [title]
2. [slide title]
3. [slide title]
...
N. Closing — [closing message]

Open in slidini editor: bun run dev
Import the .slide.json file from the toolbar.
```

## JSON Generation Guidelines

### Slide Background Patterns

**Solid Color** (most slides):
```json
{ "type": "color", "value": "[colors.background]" }
```

**Gradient** (cover, section dividers):
```json
{
  "type": "gradient",
  "gradient": {
    "kind": "linear",
    "angle": 135,
    "stops": [
      { "color": "[colors.accent]", "position": 0 },
      { "color": "[colors.accentSecondary]", "position": 100 }
    ]
  }
}
```

### Text Element Pattern

```json
{
  "type": "text",
  "id": "[unique-id]",
  "position": { "x": [x], "y": [y] },
  "size": { "width": [w], "height": [h] },
  "rotation": 0,
  "opacity": 1,
  "zIndex": [z],
  "content": "[markdown content]",
  "style": {
    "color": "[hex]",
    "fontSize": [size],
    "fontFamily": "sans-serif",
    "fontWeight": "normal" | "bold",
    "fontStyle": "normal",
    "textDecoration": "none",
    "textAlign": "left" | "center" | "right",
    "lineHeight": 1.5,
    "backgroundColor": null,
    "padding": 0
  },
  "animations": []
}
```

### Font Size Guide

| Element | fontSize |
|---------|----------|
| Cover title | 72 |
| Section title | 60 |
| Slide title | 48 |
| Subtitle | 36 |
| Body text | 32 |
| Bullet points | 28-32 |
| Caption / attribution | 24-28 |
| Key stat number | 120-160 |

### Animation Pattern

Add subtle entrance animations to important elements:

```json
{
  "type": "fade-in",
  "duration": 0.5,
  "delay": 0.2,
  "easing": "ease-out",
  "trigger": "onEnter",
  "stepIndex": 0
}
```

For progressive reveal (fragments), use incrementing `stepIndex`:
- `stepIndex: 0` = always visible
- `stepIndex: 1` = appears on first click/advance
- `stepIndex: 2` = appears on second click/advance

### Default Transition

```json
{ "type": "fade", "duration": 0.5, "easing": "ease-out" }
```

## References

| File | Content |
|------|---------|
| `references/layouts.md` | Layout patterns with exact coordinates |
| `references/content-rules.md` | Content writing guidelines |
| `references/outline-template.md` | Outline format and examples |
| `references/design-guidelines.md` | Visual hierarchy and design principles |
| `references/image-generation.md` | Gemini CLI image generation setup and prompts |
