# Design Guidelines

Visual hierarchy and design principles for slide generation.

## Canvas Specifications

| Property | Value |
|----------|-------|
| Width | 1920 px |
| Height | 1080 px |
| Aspect Ratio | 16:9 |
| Margin (horizontal) | 120 px from edges |
| Margin (vertical) | 60 px from edges |
| Safe area | 120-1800 (x), 60-1020 (y) |

## Visual Hierarchy

| Principle | Description |
|-----------|-------------|
| Focal Point | ONE dominant element per slide draws attention first |
| Size Contrast | Headlines 1.5-2x larger than body text |
| Breathing Room | Minimum 120px margin from horizontal edges, 60px from vertical |
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
| `accent` | Emphasis, primary highlight | Section headers bg, gradient start |
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
| Display | 72 | bold | textPrimary | Cover title only |
| H1 | 60 | bold | textPrimary | Section divider |
| H2 | 48 | bold | textPrimary | Slide title |
| H3 | 36 | bold | textPrimary | Subtitle, sub-headings |
| Body | 32 | normal | textSecondary | Main body text |
| Small | 28 | normal | textSecondary | Bullet points, details |
| Caption | 24 | normal | textMuted | Attributions, notes |
| Stat | 120-160 | bold | accent | Large statistics |

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
| Margins | Same horizontal (120px) and vertical (60px) margins on all slides |
| Title position | Same x,y position for all title-body slides |
| Font sizes | Same size for same content type across all slides |
| Colors | Use only colors from the selected ColorSet |
| Transitions | Use the same transition type for all content slides |

## Content Density by Slide Type

| Type | Max Text Elements | Max Bullet Points | Notes |
|------|-------------------|-------------------|-------|
| Cover | 2 (title + subtitle) | 0 | Keep minimal |
| Content | 2 (title + body) | 5 | Focus on key points |
| Two-column | 3 (title + 2 cols) | 3-4 per column | Balance both sides |
| Comparison | 5 (title + 2 headers + 2 bodies) | 3-4 per side | Keep parallel |
| Section divider | 1 | 0 | Section name only |
| Quote | 2 (quote + attribution) | 0 | Let quote breathe |
| Key stat | 3 (number + label + context) | 0 | One number dominates |
| Closing | 2 (message + subtext) | 0 | Impactful and clean |
