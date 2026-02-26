# Layout Patterns

Exact element positions and sizes for each layout on a 1920x1080 canvas.

All values in pixels. Margin from edges: 120px horizontal, 60px vertical.

## title-hero

Large centered title with optional subtitle. For cover slides.

```
Title:    position(160, 320)  size(1600, 200)  fontSize:72  bold  center
Subtitle: position(160, 540)  size(1600, 120)  fontSize:36  normal center
```

Background: gradient recommended (accent → accentSecondary, angle 135)

## title-body

Top title with bullet-point body. Most common content layout.

```
Title: position(120, 60)   size(1680, 160)  fontSize:48  bold  left
Body:  position(120, 260)  size(1680, 700)  fontSize:32  normal left  lineHeight:1.8
```

Background: solid color (background)

## two-column

Title with two equal text columns.

```
Title:      position(120, 60)    size(1680, 160)  fontSize:48  bold  left
Left col:   position(120, 260)   size(800, 700)   fontSize:28  normal left  lineHeight:1.6
Right col:  position(1000, 260)  size(800, 700)   fontSize:28  normal left  lineHeight:1.6
```

## comparison

Color-coded two-column comparison with category headers.

```
Title:        position(120, 60)    size(1680, 140)  fontSize:48  bold   center
Left header:  position(120, 240)   size(800, 80)    fontSize:32  bold   center  bgColor:accent     padding:16
Left body:    position(120, 340)   size(800, 620)   fontSize:28  normal left    lineHeight:1.8
Right header: position(1000, 240)  size(800, 80)    fontSize:32  bold   center  bgColor:accentSecondary padding:16
Right body:   position(1000, 340)  size(800, 620)   fontSize:28  normal left    lineHeight:1.8
```

## section-divider

Centered section name on gradient background.

```
Section: position(160, 420)  size(1600, 240)  fontSize:60  bold  center
```

Background: gradient (accent → accentSecondary, angle 135)

## quote

Centered italic quote with attribution.

```
Quote:       position(240, 280)  size(1440, 360)  fontSize:40  italic center  lineHeight:1.8
Attribution: position(240, 680)  size(1440, 100)  fontSize:28  normal center  color:textMuted
```

## key-stat

Single large number as focal point with context text.

```
Number:  position(160, 200)  size(1600, 300)  fontSize:144 bold   center
Label:   position(160, 520)  size(1600, 100)  fontSize:36  normal center  color:textSecondary
Context: position(240, 660)  size(1440, 200)  fontSize:28  normal center  color:textMuted
```

## three-point

Title with three equally-spaced content blocks.

```
Title:   position(120, 60)    size(1680, 160)  fontSize:48  bold  left
Block 1: position(120, 280)   size(520, 680)   fontSize:26  normal left  lineHeight:1.6
Block 2: position(700, 280)   size(520, 680)   fontSize:26  normal left  lineHeight:1.6
Block 3: position(1280, 280)  size(520, 680)   fontSize:26  normal left  lineHeight:1.6
```

Use `### Heading` inside each block's Markdown for block titles.

## image-text

Left placeholder for image, right text content.

```
Image area: position(120, 120)   size(840, 840)   (ImageElement, fit: contain)
Title:      position(1040, 120)  size(760, 120)   fontSize:40  bold  left
Body:       position(1040, 280)  size(760, 680)   fontSize:28  normal left  lineHeight:1.8
```

With `--with-images`, the image is auto-generated via Gemini CLI and src is populated.
Without `--with-images`, leave src empty (user adds via editor).

## title-body-image

Title-body layout with a right-side accent image. Used when `--with-images` and content slide needs illustration.

```
Title:  position(120, 60)    size(1080, 160)  fontSize:48  bold  left
Body:   position(120, 260)   size(1080, 700)  fontSize:32  normal left  lineHeight:1.8
Image:  position(1260, 160)  size(540, 540)   (ImageElement, fit: contain)  zIndex:1
```

## title-hero-image

Cover slide with background image. Text overlaid on semi-transparent overlay.

```
Background: image (fit: cover, the generated image)
Overlay: position(0, 0)      size(1920, 1080)  bgColor:rgba(bg, 0.6)  zIndex:1
Title:   position(160, 340)  size(1600, 200)   fontSize:72  bold  center  zIndex:2
Subtitle:position(160, 560)  size(1600, 120)   fontSize:36  center  zIndex:3
```

## section-divider-image

Section divider with subtle background image.

```
Background: image (fit: cover, opacity controlled via overlay)
Overlay: position(0, 0)      size(1920, 1080)  bgColor:rgba(bg, 0.7)  zIndex:1
Section: position(160, 420)  size(1600, 240)   fontSize:60  bold  center  zIndex:2
```

## closing

Centered closing statement for final slide.

```
Message:    position(160, 340)  size(1600, 200)  fontSize:48  bold   center
Subtext:    position(240, 580)  size(1440, 160)  fontSize:28  normal center  color:textMuted
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
