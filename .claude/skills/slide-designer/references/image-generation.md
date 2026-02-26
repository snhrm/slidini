# Image Generation with Gemini CLI

Guide for generating slide illustrations using Gemini CLI.

## Generation Methods (Priority Order)

Try each method in order. Use the first one that works.

### Method 1: Gemini CLI with Nanobanana Extension

Best option if the nanobanana extension is installed.

**Check availability**:
```bash
gemini -p "list your available tools" --output-format json -y 2>/dev/null | head -20
```

**Generate image**:
```bash
gemini -p "/generate \"[prompt]\" --styles=\"[style]\"" -y 2>/dev/null
```

Images are saved to `./nanobanana-output/`. Move them to the target directory after generation.

**Nanobanana install** (if not available):
```bash
gemini extensions install https://github.com/gemini-cli-extensions/nanobanana
```

### Method 2: Gemini CLI Direct (Headless Mode)

Use Gemini CLI's native image generation capability.

```bash
gemini -p "Generate an image: [prompt]. Save the image as [output-path]." -y 2>/dev/null
```

The `-y` flag auto-approves file operations. The `-p` flag runs in non-interactive (headless) mode.

### Method 3: Gemini API via Script

Direct API call using a TypeScript script with Bun.

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
    console.log('Saved:', process.argv[3]);
    break;
  }
}
" "[prompt]" "[output-path]"
```

**Required**: `GEMINI_API_KEY` or `GOOGLE_API_KEY` environment variable.

**Install dependency** (if needed):
```bash
bunx jsr add @anthropic-ai/sdk  # not needed
bun add @google/genai  # run in a temp dir if needed
```

### Method 4: Fall Back to Text-Only

If none of the above methods work, proceed with text-only slide generation. Inform the user:
```
Image generation unavailable (Gemini CLI not configured).
Generating text-only slides. Add images later via the slidini editor.
```

## Prompt Engineering for Slide Illustrations

### Base Prompt Template

```
Create a [STYLE] illustration for a presentation slide.
Subject: [SUBJECT]
Style: [STYLE_DETAILS]
Aspect ratio: 16:9
Requirements:
- Clean, professional presentation-quality image
- No text or labels in the image
- [COLOR_GUIDANCE]
- Simple composition suitable as slide background or accent
```

### Style-Specific Prompt Modifiers

| Style | Prompt Addition |
|-------|----------------|
| `flat-illustration` | "Flat vector illustration with clean shapes, no gradients, bold solid colors, simple geometric forms" |
| `watercolor` | "Soft watercolor painting with gentle color washes, organic edges, subtle paper texture" |
| `sketch` | "Hand-drawn pencil sketch with clean line work, crosshatching for shading, minimal color" |
| `photorealistic` | "Photorealistic high-quality photograph, professional lighting, shallow depth of field" |
| `minimalist` | "Ultra minimal illustration with maximum whitespace, one or two simple shapes, monochrome with single accent color" |
| `abstract` | "Abstract geometric composition with overlapping shapes, bold color blocks, dynamic angles" |
| `pixel-art` | "Retro pixel art in 8-bit style, chunky pixels, limited color palette, nostalgic gaming aesthetic" |

### Color Guidance from ColorSet

Match illustration colors to the slide's ColorSet:

| Color Set | Color Guidance |
|-----------|---------------|
| `dark-slate` | "Use cool blue-gray tones (#1e293b, #334155) with purple-blue accents (#667eea)" |
| `light-clean` | "Use light neutral tones with blue (#3b82f6) and purple (#8b5cf6) accents on white" |
| `midnight-blue` | "Use deep navy (#0f172a) with cyan (#38bdf8) and indigo (#818cf8) accents" |
| `warm-sunset` | "Use warm dark tones (#1c1917) with amber (#f59e0b) and red (#ef4444) accents" |
| `forest-green` | "Use deep forest green (#052e16) with bright green (#22c55e) and cyan (#06b6d4) accents" |
| `monochrome` | "Use grayscale only, black (#18181b) to white (#fafafa), no color" |

### Slide-Type Specific Prompts

**Cover Slide**:
```
Create a [STYLE] illustration representing the concept of "[TOPIC]".
Wide panoramic composition suitable as a presentation cover.
Abstract or metaphorical representation, not literal.
[COLOR_GUIDANCE]
```

**Content Slide** (accent image):
```
Create a small [STYLE] illustration of [SPECIFIC_SUBJECT].
Simple, iconic representation suitable as a slide accent.
Clean composition with transparent or solid background.
[COLOR_GUIDANCE]
```

**Section Divider**:
```
Create a [STYLE] abstract pattern or texture for a section divider slide.
Subtle, not overwhelming. Works as a background overlay at 30% opacity.
[COLOR_GUIDANCE]
```

## Image Embedding in JSON

### As Background Image

For cover slides and section dividers, use the image as slide background:

```json
{
  "background": {
    "type": "image",
    "src": "./images/01-cover.png",
    "fit": "cover"
  }
}
```

Add a semi-transparent overlay for text readability:
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
Then place the actual text elements above (zIndex: 2+).

### As Inline Image Element

For content slides with illustrations:

```json
{
  "type": "image",
  "id": "[unique-id]",
  "src": "./images/03-illustration.png",
  "fit": "contain",
  "position": { "x": [x], "y": [y] },
  "size": { "width": [w], "height": [h] },
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

## Layout Adjustments for Image Slides

When a slide has an image, adjust text element positions:

### title-hero with Background Image

```
Background: image (fit: cover)
Overlay:    position(0, 0)       size(1920, 1080)  bgColor: rgba(bg, 0.6)  zIndex:1
Title:      position(160, 340)   size(1600, 200)   fontSize:72  bold  center  zIndex:2
Subtitle:   position(160, 560)   size(1600, 120)   fontSize:36  center  zIndex:3
```

### title-body with Right Accent Image

```
Title:  position(120, 60)    size(1080, 160)   fontSize:48  bold  left
Body:   position(120, 260)   size(1080, 700)   fontSize:32  normal left
Image:  position(1260, 160)  size(540, 540)    fit:contain   zIndex:1
```

### image-text (Image Left, Text Right)

```
Image:  position(120, 120)    size(840, 840)   fit:contain
Title:  position(1040, 120)   size(760, 120)   fontSize:40  bold
Body:   position(1040, 280)   size(760, 680)   fontSize:28  normal
```

## Image File Naming

Format: `{NN}-{slug}.png`

| Slide | Filename |
|-------|----------|
| Cover | `01-cover.png` |
| Content slide 3 | `03-key-finding.png` |
| Section divider 5 | `05-section-growth.png` |
| Closing | `10-closing.png` |

## Error Handling

| Error | Action |
|-------|--------|
| Gemini CLI not found | Fall back to text-only, warn user |
| API key not set | Fall back to text-only, show setup instructions |
| Generation fails | Auto-retry once, then skip that image with warning |
| Image save fails | Skip with warning, continue with remaining slides |
| All images fail | Complete with text-only output, report errors |

## Gemini API Models

| Model | ID | Notes |
|-------|----|-------|
| Nano Banana (default) | `gemini-2.5-flash-image` | Fast, efficient |
| Nano Banana Pro | `gemini-3-pro-image-preview` | Higher quality, slower |

Set `NANOBANANA_MODEL=gemini-3-pro-image-preview` for Pro quality when using the nanobanana extension.
