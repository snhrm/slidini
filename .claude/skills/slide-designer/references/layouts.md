# Layout Patterns

Exact element positions and sizes for each layout on a 1920x1080 canvas.

All values in pixels. Margin from edges: 100px horizontal, 50px vertical.

## Height Calculation Rule

**CRITICAL**: Element height must accommodate the actual content. Calculate as:

```
requiredHeight = numberOfLines × fontSize × lineHeight + padding × 2 + 10
```

- `padding` はテキスト要素の `style.padding` 値。上下両方に適用されるため **×2** が必要
- Markdown の箇条書きは1項目＝最低1行としてカウント
- コードブロックは行数をそのままカウント

When generating JSON, count the actual lines of Markdown content (including bullet items) and set height accordingly. **Never use a fixed height that could clip text.** If content is long, either increase height, reduce font size, or split across slides.

## title-hero

Large centered title with optional subtitle. For cover slides.

```
Title:    position(100, 300)  size(1720, 240)  fontSize:80  bold  center
Subtitle: position(100, 560)  size(1720, 140)  fontSize:40  normal center
```

Background: gradient recommended (accent → accentSecondary, angle 135)

## title-body

Top title with bullet-point body. Most common content layout.

```
Title: position(100, 50)   size(1720, 140)  fontSize:52  bold  left
Body:  position(100, 220)  size(1720, 780)  fontSize:36  normal left  lineHeight:1.7
```

Background: solid color (background)

## two-column

Title with two equal text columns.

```
Title:      position(100, 50)    size(1720, 140)  fontSize:52  bold  left
Left col:   position(100, 220)   size(820, 780)   fontSize:32  normal left  lineHeight:1.7
Right col:  position(1000, 220)  size(820, 780)   fontSize:32  normal left  lineHeight:1.7
```

## comparison

Color-coded two-column comparison with category headers.

```
Title:        position(100, 50)    size(1720, 130)  fontSize:52  bold   center
Left header:  position(100, 210)   size(830, 80)    fontSize:36  bold   center  bgColor:accent     padding:16
Left body:    position(100, 310)   size(830, 700)   fontSize:32  normal left    lineHeight:1.7
Right header: position(1000, 210)  size(820, 80)    fontSize:36  bold   center  bgColor:accentSecondary padding:16
Right body:   position(1000, 310)  size(820, 700)   fontSize:32  normal left    lineHeight:1.7
```

## section-divider

Centered section name on gradient background.

```
Section: position(100, 380)  size(1720, 320)  fontSize:64  bold  center
```

Background: gradient (accent → accentSecondary, angle 135)

## quote

Centered italic quote with attribution.

```
Quote:       position(160, 240)  size(1600, 420)  fontSize:44  italic center  lineHeight:1.8
Attribution: position(160, 700)  size(1600, 100)  fontSize:28  normal center  color:textMuted
```

## key-stat

Single large number as focal point with context text.

```
Number:  position(100, 180)  size(1720, 320)  fontSize:160 bold   center  color:accent
Label:   position(100, 520)  size(1720, 120)  fontSize:40  normal center  color:textSecondary
Context: position(160, 680)  size(1600, 220)  fontSize:32  normal center  color:textMuted
```

## three-point

Title with three equally-spaced content blocks.

```
Title:   position(100, 50)    size(1720, 140)  fontSize:52  bold  left
Block 1: position(100, 220)   size(540, 780)   fontSize:28  normal left  lineHeight:1.6
Block 2: position(690, 220)   size(540, 780)   fontSize:28  normal left  lineHeight:1.6
Block 3: position(1280, 220)  size(540, 780)   fontSize:28  normal left  lineHeight:1.6
```

Use `### Heading` inside each block's Markdown for block titles.

## image-text

Left placeholder for image, right text content.

```
Image area: position(60, 60)     size(900, 960)   (ImageElement, fit: contain)
Title:      position(1020, 80)   size(840, 140)   fontSize:44  bold  left
Body:       position(1020, 250)  size(840, 750)   fontSize:32  normal left  lineHeight:1.7
```

With `--with-images`, the image is auto-generated via Gemini CLI and src is populated.
Without `--with-images`, leave src empty (user adds via editor).

## title-body-image

Title-body layout with a right-side accent image. Used when `--with-images` and content slide needs illustration.

```
Title:  position(100, 50)    size(1100, 140)  fontSize:52  bold  left
Body:   position(100, 220)   size(1100, 780)  fontSize:36  normal left  lineHeight:1.7
Image:  position(1260, 140)  size(580, 580)   (ImageElement, fit: contain)  zIndex:1
```

## title-hero-image

Cover slide with background image. Text overlaid on semi-transparent overlay.

```
Background: image (fit: cover, the generated image)
Overlay: position(0, 0)      size(1920, 1080)  bgColor:rgba(bg, 0.6)  zIndex:1
Title:   position(100, 300)  size(1720, 240)   fontSize:80  bold  center  zIndex:2
Subtitle:position(100, 560)  size(1720, 140)   fontSize:40  center  zIndex:3
```

## section-divider-image

Section divider with subtle background image.

```
Background: image (fit: cover, opacity controlled via overlay)
Overlay: position(0, 0)      size(1920, 1080)  bgColor:rgba(bg, 0.7)  zIndex:1
Section: position(100, 380)  size(1720, 320)   fontSize:64  bold  center  zIndex:2
```

## closing

Centered closing statement for final slide.

```
Message:    position(100, 320)  size(1720, 240)  fontSize:56  bold   center
Subtext:    position(160, 600)  size(1600, 180)  fontSize:32  normal center  color:textMuted
```

Background: gradient or solid (match cover slide style)

## Layout Selection Guide

| Content Type | Recommended Layout |
|--------------|--------------------|
| Deck title | `title-hero` |
| Main content | `title-body` |
| Two concepts | `two-column` |
| Before/after, pros/cons | `comparison` |
| New section | `section-divider` |
| Key insight, testimonial | `quote` |
| Impact metric | `key-stat` |
| Three features/benefits | `three-point` |
| Feature + visual | `image-text` |
| Final slide | `closing` |

## Slide Flow Pattern

| Position | Recommended |
|----------|-------------|
| Slide 1 | `title-hero` (always) |
| Slide 2 | `title-body` (agenda/overview) |
| Section starts | `section-divider` |
| Content | `title-body`, `two-column`, `three-point` |
| Data/Impact | `key-stat` |
| Insights | `quote` |
| Final slide | `closing` (always) |
