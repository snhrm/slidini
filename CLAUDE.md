# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev          # Vite dev server (app)
bun run build        # Production build (app)
bun run typecheck    # Type-check all packages
bun run check        # Biome lint + format check
bun run format       # Biome auto-format (writes changes)
```

MCP server: `bun run --filter @slidini/mcp start`

No test framework is configured.

## Architecture

Bun workspace monorepo with 5 packages:

```
app ──> renderer ──> core
 │                    ▲
 ├──> templates ──────┘
 │                    ▲
mcp ──> templates ────┘
 └──> core
```

- **core** (`@slidini/core`): Types, Zod schemas, defaults. Framework-free, depends only on `zod`. Exports `parsePresentation()` for validation, `generateId(prefix)` for ID generation, factory functions like `createDefaultSlide()`.
- **renderer** (`@slidini/renderer`): React slide renderer using Framer Motion. **No Tailwind** — all inline styles. Designed for future extraction as a standalone npm package. Uses `ResizeObserver` + CSS `transform: scale()` for viewport fitting.
- **templates** (`@slidini/templates`): 10 slide template JSONs + 6 color set presets. Templates use `colorRole`/`bgColorRole` for semantic color mapping. Color sets use immediate hex-to-hex replacement via `applyColorSetToSlide()`.
- **app** (`@slidini/app`): Editor UI with Vite + React + Tailwind + Zustand. Single Zustand store (`usePresentationStore`) manages all state.
- **mcp** (`@slidini/mcp`): MCP server (stdio transport, 19 tools) for AI-driven `.slide.json` file manipulation.

## Code Style (Biome-enforced)

- **Tabs** for indentation
- **No trailing semicolons** (`semicolons: "asNeeded"`)
- Line width: 100
- Imports auto-organized by Biome
- Use `import type { ... }` for type-only imports

## Conventions

- All workspace packages expose source directly via `"main": "./src/index.ts"` — no build step needed for cross-package imports
- Zustand selectors always use `useShallow` from `zustand/react/shallow`
- `noUncheckedIndexedAccess: true` — array access returns `T | undefined`
- All positions/sizes are absolute pixels (1920x1080 default canvas)
- Presentation data stored as `.slide.json` files, images/videos embedded as Base64 data URIs
- `updatedAt` must be set via `new Date().toISOString()` on every mutation
- MCP tool names use `slide_` prefix with `snake_case`

## Data Model

```
Presentation
├── meta: { schemaVersion: 1, title, width, height, colorSetId?, createdAt, updatedAt }
└── slides: Slide[]
    ├── id, background (color|image|gradient), transition, colorSetId?
    └── elements: (TextElement | ImageElement | VideoElement)[]
        └── Common: id, position, size, rotation, opacity, zIndex, animations[]
```

Text content uses Markdown (rendered via react-markdown + remark-gfm).

## Language

Project documentation and UI text are in Japanese. Code (variable names, comments) is in English.
