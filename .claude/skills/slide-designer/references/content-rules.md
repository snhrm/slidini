# Content & Style Rules

Guidelines for slide content quality and consistency.

## Content Rules

### 1. One Message Per Slide
- Each slide communicates ONE main idea
- Remove redundant information
- Prioritize clarity over comprehensiveness

### 2. Self-Contained Content
- Every slide should be understandable on its own
- No references to "the previous slide" or "as we discussed"
- Include all necessary context within each slide

### 3. No Placeholders
- All text content must be fully specified
- No "[insert data here]" or "TBD"
- Generate real content based on the source material

## Style Rules

### 1. Narrative Headlines
Headlines tell the story, not label the content.

| Bad | Good |
|-----|------|
| "Key Statistics" | "Usage doubled in 6 months" |
| "Our Solution" | "One platform replaces five tools" |
| "Benefits" | "Teams save 10 hours weekly" |
| "Overview" | "Three pillars drive our growth" |
| "Background" | "A decade of innovation led here" |

### 2. Avoid AI Cliches
Remove these patterns:
- "Dive into", "explore", "journey", "landscape"
- "Let's look at", "let me show you"
- "Exciting", "amazing", "revolutionary", "game-changing"
- "In conclusion", "to summarize", "in summary"
- "Unlock", "leverage", "harness", "empower"

### 3. Meaningful Closing Slide
Not just "Thank you" or "Questions?"

Include one of:
- Clear call-to-action
- Memorable key takeaway
- Thought-provoking closing statement
- Next steps with specifics

### 4. Markdown Formatting

**Titles**: Use `#` for cover titles, `##` for slide titles, `###` for section sub-headers.

**Body Content**:
- Use `-` for bullet points (not `*`)
- Use `**bold**` for emphasis on key terms
- Use `>` for quotes
- Keep bullet points concise (1-2 lines each)
- Maximum 5 bullet points per slide

**Text Hierarchy**:
- One `#` or `##` heading per text element
- Body text in separate element from titles
- Don't mix heading levels in one element

## Presentation Flow

### Opening (Slides 1-2)

| Slide | Purpose |
|-------|---------|
| Cover | Title + hook + visual identity |
| Overview | Agenda or key question framing |

### Middle (Content Slides)

**Flow Patterns**:

| Pattern | When to Use |
|---------|-------------|
| Problem → Solution | Introducing new products/ideas |
| What → Why → How | Educational content |
| Past → Present → Future | Transformation stories |
| Claim → Evidence → Action | Data-driven arguments |

### Closing (Final Slide)

| Element | Purpose |
|---------|---------|
| Key takeaway | Reinforce core message |
| Call-to-action | Clear next steps |
| Memorable close | Resonant statement |

## Content Density

| Level | Guideline |
|-------|-----------|
| Title slides | Title + subtitle only |
| Content slides | Title + 3-5 bullet points |
| Quote slides | Quote + attribution only |
| Stat slides | One number + context |
| Section dividers | Section name only |

## Language Handling

**Detection Priority**:
1. `--lang` flag (explicit)
2. User's conversation language
3. Source content language

**Rule**: ALL generated content uses the detected language:
- Slide text content
- Progress reports and confirmations
- Error messages

Technical terms (file paths, JSON keys) remain in English.
