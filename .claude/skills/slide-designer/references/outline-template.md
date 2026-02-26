# Outline Template

Standard structure for slide deck outlines.

## Format

```markdown
# Slide Deck Outline

**Topic**: [topic description]
**Color Set**: [color set id]
**Slides**: N
**Language**: [output language]

---

## Slide 1 — Cover
- **Layout**: title-hero
- **Background**: gradient
- **Headline**: [main title — narrative, compelling]
- **Subtitle**: [supporting tagline or context]

---

## Slide 2 — [Descriptive Name]
- **Layout**: title-body
- **Title**: [narrative headline — tells the story]
- **Body**:
  - [point 1 with specific detail]
  - [point 2 with specific detail]
  - [point 3 with specific detail]
- **Transition**: fade

---

## Slide N — Closing
- **Layout**: closing
- **Message**: [memorable closing statement or call-to-action]
- **Subtext**: [next steps or summary]
- **Background**: gradient | color
```

## Slide Entry Fields

| Field | Required | Description |
|-------|----------|-------------|
| Layout | Yes | Layout pattern name from layouts.md |
| Background | Cover/Divider | `gradient` or `color` (defaults to color) |
| Title/Headline | Yes | Narrative headline (not a label) |
| Subtitle | Cover only | Supporting text |
| Body | Content slides | Bullet points or paragraph |
| Transition | No | Override default (fade) |

## Content Analysis Before Outline

Before writing the outline, perform this analysis:

### 1. Core Message
- What is the single most important takeaway?
- State it in 15 words or fewer

### 2. Supporting Points (3-5 max)
- What evidence supports the core message?
- Prioritize by audience relevance

### 3. Visual Opportunities
| Content Type | Layout |
|--------------|--------|
| Comparisons | `comparison` or `two-column` |
| Processes/Steps | `title-body` with numbered items |
| Key statistics | `key-stat` |
| Quotes/Insights | `quote` |
| Three concepts | `three-point` |

### 4. Flow Pattern
Choose based on content type:
- Problem → Solution → Benefits
- What → Why → How
- Past → Present → Future
- Context → Evidence → Action

## Slide Type Templates

### Cover
```
## Slide 1 — Cover
- **Layout**: title-hero
- **Background**: gradient
- **Headline**: [compelling title]
- **Subtitle**: [context or tagline]
```

### Content (Standard)
```
## Slide X — [Name]
- **Layout**: title-body
- **Title**: [narrative headline]
- **Body**:
  - [concrete point 1]
  - [concrete point 2]
  - [concrete point 3]
```

### Section Divider
```
## Slide X — Section: [Name]
- **Layout**: section-divider
- **Background**: gradient
- **Section**: [section name]
```

### Key Statistic
```
## Slide X — [Name]
- **Layout**: key-stat
- **Number**: [large stat with unit]
- **Label**: [what the number represents]
- **Context**: [why it matters]
```

### Quote
```
## Slide X — [Name]
- **Layout**: quote
- **Quote**: [the quote text]
- **Attribution**: [source]
```

### Comparison
```
## Slide X — [Name]
- **Layout**: comparison
- **Title**: [comparison framing]
- **Left Label**: [category A]
- **Left Points**: [items]
- **Right Label**: [category B]
- **Right Points**: [items]
```

### Closing
```
## Slide N — Closing
- **Layout**: closing
- **Message**: [impactful closing]
- **Subtext**: [call-to-action or next steps]
```

## Slide Count Guidelines

| Content Length | Recommended | Structure |
|---------------|-------------|-----------|
| Brief (< 500 words) | 5-8 | Cover + 3-5 content + Closing |
| Medium (500-2000 words) | 8-15 | Cover + 1-2 sections + Closing |
| Long (2000-5000 words) | 12-20 | Cover + 2-3 sections + Closing |
| Very long (> 5000 words) | 15-25 | Cover + 3-4 sections + Closing |

**Section structure**: Section divider + 3-5 content slides per section.
