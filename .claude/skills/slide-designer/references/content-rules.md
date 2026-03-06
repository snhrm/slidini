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

### 4. Depth Over Breadth

**表面的な箇条書きではなく、具体的で説得力のある内容を書く。**

| Bad (薄い内容) | Good (深い内容) |
|---|---|
| `- パフォーマンスが向上する` | `- レスポンス時間が平均200ms→50msに短縮、ユーザー離脱率が15%改善` |
| `- コスト削減` | `- 年間インフラコストを40%削減（月額$12K→$7.2K）、ROIは6ヶ月で回収` |
| `- 使いやすい` | `- 初回セットアップ5分、設定ファイル不要で既存CIに即統合` |
| `- セキュリティ対策` | `- SOC2 Type II準拠、E2E暗号化、90日ごとの第三者監査を実施` |

Each bullet must include at least one of:
- **具体的な数値** (%, 時間, 金額, 件数)
- **比較** (Before/After, 従来手法との差)
- **具体例** (実際のユースケース、ツール名、手順)
- **因果関係** (なぜそうなるか、どういう仕組みか)

### 5. Audience Engagement

聴衆の関心を引く内容にする:

- **問いかけ**: 「〜という経験はないでしょうか？」で始めると共感を得やすい
- **意外な事実**: 通説と異なるデータや事実を提示する
- **ストーリー**: 抽象論より、具体的なシナリオで語る
- **対比**: Before/After、従来/新方式の対比で変化を際立たせる

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
| "課題" | "開発者の40%が週5時間をデプロイ作業に浪費" |
| "機能紹介" | "1コマンドで本番環境に安全にデプロイ" |

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
- Clear call-to-action with specific next step
- Memorable key takeaway backed by data
- Thought-provoking closing statement
- Next steps with concrete timeline or URL

### 4. Markdown Formatting

**Titles**: Use `#` for cover titles, `##` for slide titles, `###` for section sub-headers.

**Body Content**:
- Use `-` for bullet points (not `*`)
- Use `**bold**` for emphasis on key terms and numbers
- Use `>` for quotes
- Each bullet is 2-3 lines with specific detail (not just a phrase)
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
| Content slides | Title + 3-5 bullet points (each 2-3 lines with detail) |
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
