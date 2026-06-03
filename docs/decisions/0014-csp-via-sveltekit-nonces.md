# 0014 — CSP via SvelteKit `kit.csp` nonces

- **Status:** Accepted
- **Date:** 2026-06-03
- **Deciders:** Lead (Haruki), implementer (C3b)
- **Tags:** security, csp, build

## Context

SvelteKit's SSR engine serializes the server-load payload (e.g. `initialData` from
`+page.server.ts`) into a small inline `<script>` tag on every HTML response. The
tag's content changes per request, so its SHA-256 hash cannot be statically
allow-listed in a CSP.

Phase C3a shipped a manual `Content-Security-Policy` header in `hooks.server.ts`
with `script-src 'self'`. This header blocked SvelteKit's inline bootstrap script
in **every** environment — dev, test, and production — because `'self'` only permits
scripts loaded from the same origin, not inline content. The result: Svelte 5 never
hydrated the page, leaving all interactivity (map toggle, pin click, callout) dead
without any visible error to the end user.

The bug was masked during C3a because the list-view e2e tests only asserted on
SSR-rendered content (links, text) and never exercised a reactive click handler.
It surfaced in C3b when map-toggle tests required client-side reactivity.

A subsequent workaround in C3b added `'unsafe-inline'` to `script-src` when
`NODE_ENV !== 'production'`. This fixed test/dev but left production broken and
introduced an environment-dependent security posture — the opposite of what a
security layer should do.

## Options considered

### Option A — Static hash in `script-src`

Allow the inline script by computing its SHA-256 hash and adding it as
`'sha256-<hash>'` to `script-src`.

Pros:
- No framework coupling; works with any CSP mechanism.

Cons:
- The hash changes on every deployment (SvelteKit version bumps) and on every
  request when the serialized data differs. Practically unmaintainable. Requires
  either CI automation to update it or a script that runs after every build and
  patches the hooks file.

### Option B — `'unsafe-inline'` in `script-src`

Allow all inline scripts unconditionally.

Pros:
- Zero friction. Works everywhere.

Cons:
- Defeats the entire purpose of `script-src`. XSS can inject and execute arbitrary
  scripts. Not acceptable even for a public read-only app.

### Option C — `kit.csp` in `svelte.config.js` with `mode: 'auto'`

Delegate CSP to SvelteKit's built-in `kit.csp` configuration. In `mode: 'auto'`
SvelteKit picks the strongest mechanism available for each environment: nonces
when the adapter can inject a per-request value (Node.js adapter), hashes
otherwise. On every response it emits a `Content-Security-Policy` header that
includes the nonce/hash for its own inline scripts alongside the configured
directives.

Pros:
- Correct in all environments with no per-environment branches.
- `script-src 'self'` remains strict; only SvelteKit's own inline scripts are
  exempted via per-request nonces.
- Framework owns its own invariant: if SvelteKit changes the inline script
  mechanism, `kit.csp` updates accordingly — no manual maintenance.

Cons:
- Cannot set `Content-Security-Policy` in `hooks.server.ts` for the same response:
  setting it there overrides the nonce-bearing header SvelteKit emits and re-breaks
  hydration. The hooks file must not touch the CSP header.

## Decision

Use `kit.csp` in `svelte.config.js` (`mode: 'auto'`), remove the manual
`Content-Security-Policy` header from `hooks.server.ts`, and keep all other
security headers (`Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy`,
`Strict-Transport-Security`) in `hooks.server.ts` unchanged.

The deciding factor: Option C is the only approach that is correct and maintainable
in all environments simultaneously, without weakening the security posture.

## Consequences

- SvelteKit emits the `Content-Security-Policy` header (with per-request nonce).
  `hooks.server.ts` must not set that header or it will override the nonce.
- The nonce is only propagated to SvelteKit's own inline scripts. Any future
  inline script added outside SvelteKit's mechanism (e.g. a third-party analytics
  snippet) will be blocked and must be loaded via `src=` from an allow-listed
  origin or have its hash added to `kit.csp.directives`.
- Verifying the nonce: after `bun run build && bun run preview`, load any page,
  inspect `Content-Security-Policy` in response headers. It will contain
  `'nonce-<base64>'` in `script-src`. The inline `<script>` tag in the HTML will
  carry a matching `nonce=` attribute. No CSP violation in the browser console.
- `kit.csp` must be kept in sync with `security.md`. A PR that weakens a directive
  (e.g. adds `'unsafe-eval'`) requires an ADR amendment.

## Compliance

- Linked rule: `.claude/rules/security.md` — supersedes the manual `script-src`
  portion of the hooks CSP.
- Linked config: `svelte.config.js` (`kit.csp`).
- This ADR supersedes the CSP sections of the hooks established in the Phase A
  security baseline; all other headers in `hooks.server.ts` remain authoritative.

## Notes

Verified on 2026-06-03 with `adapter-node` + `vite preview`:

- Response header `Content-Security-Policy` contains `script-src 'self' 'nonce-<…>'`.
- The inline `<script>` in `/peta` HTML carries a matching `nonce=` attribute.
- No CSP violation in browser devtools console.
- Svelte 5 hydrates: map toggle, pin click, callout all function correctly.
- `bun run check && bun run lint && bun run test && bun run test:e2e && bun run build`
  all pass with 0 warnings; no `unsafe-inline` in any script directive.

Reference: SvelteKit docs — [Content Security Policy](https://svelte.dev/docs/kit/configuration#csp).
