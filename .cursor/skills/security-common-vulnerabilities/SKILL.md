---
name: security-common-vulnerabilities
description: >-
  Applies secure-by-default patterns for this Excalidraw monorepo (React/Vite/TypeScript,
  excalidraw-app backends, Firebase, embeds, storage). Use when implementing features,
  reviewing changes, handling URLs/HTML/user input, env config, collaboration, AI/TTD,
  or when the user asks about XSS, injection, secrets, CSP, or supply-chain safety.
---

# Security: Prevent Common Vulnerabilities

## Scope

This repo is a **client-heavy** editor (`packages/excalidraw`) plus **`excalidraw-app`** (Vite, optional Firebase, WebSockets, Sentry). Threats matter most around **untrusted content** (links, embeds, pasted SVG/HTML, AI responses), **browser storage**, and **misconfigured client env**.

---

## React & DOM (XSS)

- **Avoid `dangerouslySetInnerHTML`** unless the string is from a **trusted, validated** source. If unavoidable (e.g. SVG), ensure generation is **fixed-format** or **sanitized**; never pass user/remote text through without escaping or a vetted sanitizer.
- Prefer **React text nodes** and normal props for user-visible strings.
- **`iframe` / `srcDoc` / dynamic HTML** (embeddables, TTD/AI HTML previews): treat all remote HTML as hostile. Prefer **sandboxed** iframes, **strict allowlists** for origins, and **no injection** of unsanitized strings into templates (string interpolation into HTML = XSS risk).

## URLs & navigation

- **Never** pass raw user or scene `link` strings into `window.open`, `location`, or `<iframe src>` without validation. Follow existing patterns: **`toValidURL` / `normalizeLink`** from `@excalidraw/common` where the codebase already uses them (`App.tsx`, embeds, SVG export).
- **`javascript:`** and **`data:`** URLs are classic XSS vectors; block or normalize unless there is an explicit, reviewed use case.
- **`target="_blank"`** on user-controlled links: keep **`rel="noopener noreferrer"`** (see existing promo/export patterns).

## Secrets & configuration

- **`import.meta.env.VITE_*`** is **bundled into the client**. Never put API **secrets**, private keys, or internal-only tokens in `VITE_` variables. Use **server-side** endpoints for secret operations.
- **`VITE_APP_FIREBASE_CONFIG`** and similar are **public** Firebase client config by design; protect resources with **Firebase Security Rules**, not obscurity.
- Do not commit **`.env`** files with real secrets; use documented samples only.

## Storage (`localStorage` / `sessionStorage` / IDB)

- Stored data can be **tampered** by extensions or other scripts on the origin. **Do not** treat stored JSON as trusted authorization; re-validate on load where security boundaries matter.
- Avoid storing **sensitive** PII or credentials in browser storage.

## Network & collaboration

- **WebSocket / HTTP** endpoints (`VITE_APP_WS_SERVER_URL`, `VITE_APP_BACKEND_V2_*`): use **HTTPS/WSS** in production; pin expectations in docs if self-hosted.
- **Assume** messages can be spoofed or replayed unless the protocol explicitly authenticates and authorizes; do not add “trust client” checks for multi-user safety.

## Third-party & supply chain

- **No new npm dependencies** without explicit approval (see `AGENTS.md`). New packages increase audit surface.
- Prefer **existing** utilities in `packages/utils`, `@excalidraw/common`, etc., before pulling in helpers.

## Dangerous JS patterns

- **Avoid `eval`**, **`new Function`**, and **dynamic `import()` from user-controlled strings**. The subset/woff pipeline may use `new Function` internally—**do not** extend that pattern for app features.
- **Workers**: validate messages; treat **`postMessage`** payloads as untrusted if any external code can send them.

## File & clipboard

- Parsing **uploaded** `.excalidraw`, SVG, or images: expect **malformed or malicious** files; fail closed, avoid executing embedded scripts (SVG/XML), follow existing **restore / parse** flows instead of ad-hoc `DOMParser` + `innerHTML` for untrusted XML.

## Protected & high-impact areas

- Respect **`.cursor/rules/do-not-touch.mdc`**: `Renderer.ts`, `restore.ts`, `manager.tsx`, `types.ts` need extra care; security fixes there require **full tests + manual QA** per project rules.

## Review checklist (quick)

Before merging risky changes, confirm:

- [ ] User or remote strings are not concatenated into HTML/SVG/`srcdoc` without sanitization or safe APIs.
- [ ] New external URLs go through **validation** consistent with `toValidURL` / embed rules.
- [ ] No secrets in **`VITE_*`** or client bundles.
- [ ] New dependencies are **justified** and minimal.
- [ ] Storage/collaboration assumptions match **threat model** (mostly untrusted client + network).

## How to verify

- Re-run the **Review checklist** above on the final diff; every item should be satisfied or explicitly rejected with rationale.
- **Spot-check** risky patterns: search the diff for `dangerouslySetInnerHTML`, raw `innerHTML`, `eval`, `new Function` (outside known vendored code), and unvalidated URLs passed to `window.open` / `iframe` `src`.
- Confirm **`VITE_*`** env usage contains no secrets; `git grep VITE_` on changed files if needed.
- Run **`yarn test:typecheck`** and relevant **`yarn test`** / app smoke for flows touched (embeds, paste, links, AI/TTD if applicable).
- For UI-heavy changes, **manually** exercise pasted links, embeds, and any new HTML/SVG paths in a dev build.

## When this skill does not replace

- **Penetration testing**, formal **threat modeling**, or **compliance** (SOC2, etc.) are out of band.
- **Server/backend** code (if added outside this repo) needs its own OWASP/API security review.
