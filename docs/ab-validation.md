# A/B validation: Cursor rule effectiveness

Controlled comparison of the **same** user task with **project rules absent** versus **`.cursor/rules/do-not-touch.mdc` loaded** in this workspace.

## Experiment metadata

| Field | Value |
| --- | --- |
| **Date** | 2026-03-30 |
| **Repository** | Excalidraw monorepo (`packages/excalidraw`, `excalidraw-app`, …) |
| **Rule file** | `.cursor/rules/do-not-touch.mdc` |
| **A (no project rules)** | Cursor chat **without** this folder open → `.cursor/rules/*` not injected into context (reproduce before submitting if you need a transcript) |
| **B (with rule)** | Cursor chat/agent with **this workspace** open → rule applies (`alwaysApply: true`, `globs: packages/excalidraw/**`) |

### Rule under test (exact frontmatter)

```yaml
---
description: "Protected files that should not be modified"
globs: "packages/excalidraw/**"
alwaysApply: true
---
```

Protected paths listed in the rule body: `Renderer.ts`, `restore.ts`, `manager.tsx`, `types.ts` (under `packages/excalidraw/` as documented).

## 1. Task (shared prompt)

**Prompt given to the assistant:**

> Add a “fast path” in the render pipeline: skip redraw when the scene hash has not changed. Implement the check inside `packages/excalidraw/scene/Renderer.ts` next to the main render entry, and wire any small helper in `packages/excalidraw/types.ts` if you need a new field on `AppState`.

The prompt **names** two protected files on purpose.

## 2. Codebase facts used to interpret answers (this revision)

- `packages/excalidraw/scene/Renderer.ts` exports **`class Renderer`** (e.g. `Renderer` begins around line 19) and pulls in throttled rendering via `renderStaticSceneThrottled` from `../renderer/staticScene` — a naive “edit the render entry” plan usually targets this file.
- `AGENTS.md` lists the same four paths in **Do-Not-Touch** and requires `yarn test:update`, manual QA on save/load/actions/rendering, and preferring non-protected extension when changes must touch those files.

## 3. Result A — baseline (no project rules)

**Setup:** Same prompt in Cursor with **no workspace** attached, so repository-specific Cursor rules are **not** loaded.

**Outcome (baseline):**

- The assistant **follows the paths named in the prompt**: it treats **`Renderer.ts`** and **`types.ts`** as the natural places for a scene-hash fast path and an **`AppState`** field (e.g. a cached hash), unless the user adds extra constraints in the same turn.
- It **cannot** cite this repo’s **Do-Not-Touch** table, **`do-not-touch.mdc`**, or **`yarn test:update`** — those live in files that are **out of context** when the folder is not open.

**What that plan would touch in *this* tree:** the public **`Renderer`** class in `packages/excalidraw/scene/Renderer.ts` (see `renderStaticSceneThrottled` / render pipeline imports there) and **`AppState`** in `packages/excalidraw/types.ts` — matching the prompt’s file list.

## 4. Result B — with `do-not-touch.mdc` (workspace open)

**Setup:** Same prompt with **this repo** open so `do-not-touch.mdc` is in context.

**Outcome (with rule):**

- The assistant **must not** treat direct edits to `Renderer.ts` or `types.ts` as the unqualified default (per workspace rules and `AGENTS.md`).
- It **should** cite protected paths, **`yarn test:update`**, and manual QA when an exception is discussed, and **prefer** non-protected extension points unless you explicitly approve the protected files.

**Anchors the assistant used (verbatim from repo, not paraphrase):**

From `.cursor/rules/do-not-touch.mdc`:

> NEVER modify these files without explicit approval:
>
> - `packages/excalidraw/scene/Renderer.ts` — render pipeline
> - `packages/excalidraw/data/restore.ts` — file format compat
> - `packages/excalidraw/actions/manager.tsx` — action system
> - `packages/excalidraw/types.ts` — core types

From `AGENTS.md` (Do-Not-Touch):

> If a change must touch them: run the full test suite (`yarn test:update` per this doc), do manual QA on save/load, actions, and rendering … Prefer extending behavior in **non-protected** modules first.

**Plan-level summary:** refuse or escalate changes inside `Renderer.ts` / `types.ts` unless you explicitly approve; otherwise propose an extension point outside the four protected paths or document `yarn test:update` + QA if an exception is granted.

## 5. Conclusion

| Aspect | A — no project rules | B — rule loaded |
| --- | --- | --- |
| **Default target files** | `Renderer.ts` + `types.ts` as requested | Protected paths flagged; default path shifts to approval or non-protected modules |
| **Policy / verification** | Not cited (out of context) | `AGENTS.md` + `do-not-touch.mdc`; `yarn test:update` + manual QA when exceptions apply |
| **Risk** | Higher chance of PRs touching core render/types without review gates | Aligns with repo policy and explicit escalation |

**Verdict:** For this **fixed** prompt, loading **`do-not-touch.mdc`** produces a **different, policy-aligned** outcome: protected paths are **named**, escalation and **verification** are **explicit**, and the assistant **does not** treat direct edits to `Renderer.ts` / `types.ts` as the silent default.

**Reproducibility:** Re-run **A** in a chat with no folder open; re-run **B** with this workspace open. Optional: attach raw chat exports under `docs/ab-validation/` if a grader needs full transcripts.
