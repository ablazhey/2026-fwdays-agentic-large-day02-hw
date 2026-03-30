# AGENTS.md

## Project Overview

This repository is **Excalidraw**: a monorepo containing the open-source canvas diagram editor. The core editor ships as **`@excalidraw/excalidraw`** (React library); **`excalidraw-app/`** is the full web app (excalidraw.com). Work typically lives in **`packages/*`** for library features or **`excalidraw-app/`** for app-only behavior.

## Tech Stack

- **Language**: TypeScript (strict)
- **UI**: React (functional components + hooks)
- **Monorepo**: Yarn workspaces
- **Packages build**: esbuild
- **App**: Vite
- **Tests**: Vitest (see `vitest.config.mts`; path aliases for internal packages)

## Project Structure

- **`packages/excalidraw/`** — Main React component library published to npm as `@excalidraw/excalidraw`
- **`excalidraw-app/`** — Full-featured web application that uses the library
- **`packages/`** — Core packages: `@excalidraw/common`, `@excalidraw/element`, `@excalidraw/math`, `@excalidraw/utils`
- **`examples/`** — Integration examples (Next.js, browser script)

## Conventions

- **Components**: Functional components and hooks only; props type `{ComponentName}Props`; **named exports only** (no default exports); colocated tests `ComponentName.test.tsx` when behavior is non-trivial.
- **TypeScript**: No `any` and no `@ts-ignore` without justification; prefer `type` over `interface` for simple types; use `import type { X } from "..."`.
- **Files**: kebab-case for utilities (`element-utils.ts`); PascalCase for component files (`LayerUI.tsx`).

## Do-Not-Touch

Do **not** modify these paths without explicit approval and the checks below:

| Path | Reason |
|------|--------|
| `packages/excalidraw/scene/Renderer.ts` | Render pipeline |
| `packages/excalidraw/data/restore.ts` | File format compatibility |
| `packages/excalidraw/actions/manager.tsx` | Action system |
| `packages/excalidraw/types.ts` | Core types |

If a change must touch them: run the full test suite (`yarn test:update` per this doc), do manual QA on save/load, actions, and rendering, and document or record verification. Prefer extending behavior in **non-protected** modules first.

## Development Workflow

1. **Package development**: Work in `packages/*` for editor features.
2. **App development**: Work in `excalidraw-app/` for app-specific features.
3. **Testing**: Run `yarn test:all` before committing.
4. **Type safety**: Run `yarn test:typecheck` to verify TypeScript.

## Development Commands

```bash
yarn test:typecheck  # TypeScript type checking
yarn test:all     # Run all tests
yarn fix             # Auto-fix formatting and linting issues
```

## Architecture Notes

- **State**: Custom flow via `actionManager` — not Redux/Zustand/MobX; programmatic updates use **`actionManager.executeAction(action, source?, value?)`**, which runs the action’s `perform` and applies the result via the manager’s updater (keyboard shortcuts and panel UI follow the same `perform` → updater path; see `packages/excalidraw/actions/manager.tsx`). State shape centers on `AppState` (see `packages/excalidraw/types.ts`).
- **Rendering**: Canvas 2D — not React DOM for drawing; flow is Scene → `renderScene()` → canvas context. Do not introduce react-konva, fabric.js, or pixi.js for the editor canvas.
- **Dependencies**: No new npm packages without explicit approval; prefer `packages/utils/` and existing helpers before adding externals.
- **Monorepo**: Yarn workspaces; internal packages use path aliases (see `vitest.config.mts`).
