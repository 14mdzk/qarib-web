# Phase A — Foundation + App Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. Each task = one PR, on a feature branch in a git worktree, with an independent `reviewer` pass before merge (`.claude/rules/agent-dispatch.md`).

**Goal:** Turn the surfaceit boilerplate into the Qarib web app's foundation — remove the unused auth surface, switch to a public read-through BFF, default to Bahasa, and build the app shell + first primitives every later page slots into.

**Architecture:** Public, no-account SvelteKit app (ADR 0009) → read-through BFF (ADR 0012) → qarib-api public reads. Bahasa-only locale (ADR 0010). Design tokens already landed; this phase builds the chrome and primitive layer on top.

**Tech stack:** SvelteKit 2 + Svelte 5 (runes), Tailwind v4 (`@theme` tokens in `src/app.css`), Paraglide i18n, Vitest + MSW (unit), Playwright (e2e), `bun`.

**Granularity note:** This is a multi-file foundation phase, so tasks are **atomic, PR-sized** and ordered by dependency. Load-bearing logic is shown inline; component-port tasks reference `qarib-cms` source by path (the implementer reads + reskins them to tokens); mechanical deletions are listed by exact path. Within each task, follow TDD where logic exists (write the failing test first); pure deletions/markup get a smoke/e2e assertion instead.

**Gates per task PR:** `bun run check && bun run lint && bun run test && bun run build` green. e2e (`bun run test:e2e`) green for tasks that touch routes.

**Task order + dependencies:**
`A1` (strip auth + BFF read-through + identity) → `A2` (locale → id) → `A3` (primitives) → `A4` (app shell, needs A3). `A5` (utils port) is independent — any time after A1.

---

## Task A1 — Strip the auth surface, read-through BFF, fork identity

**Why:** v1 is public/no-account (ADR 0009). The auth routes, `core/auth`, the session guard, and the Bearer/CSRF BFF are unused and must go together (the BFF imports `core/auth`, so removing one without the other won't compile).

**Files:**
- Delete: `src/routes/(auth)/` (whole group: `login/`, `logout/`), `src/lib/core/auth/` (whole module), `e2e/auth.e2e.ts`
- Modify: `src/hooks.server.ts` (remove `authHandle` + its `$core/auth` imports; keep requestId/paraglide/security)
- Delete: `src/routes/(app)/+layout.server.ts` (the session guard) — `(app)` becomes public
- Replace: `src/routes/(app)/+page.svelte` (auth home → a temporary public placeholder; becomes the map in Phase C)
- Rewrite: `src/lib/server/bff-proxy.ts` (drop `accessToken`/Bearer; GET read-through; add cache headers)
- Rewrite: `src/routes/api/upstream/[...path]/+server.ts` (drop CSRF/rate-limit/auth-path/Bearer; GET only)
- Modify: `src/lib/server/bff-proxy.test.ts` (drop Bearer/accessToken assertions; assert no Authorization added)
- Modify: `messages/en.json` (remove `auth_*` strings; we replace the catalog entirely in A2 — here just delete the now-dead auth keys to keep `check` honest)
- Modify: `package.json` (`"name": "surfaceit"` → `"qarib-web"`), `src/app.html` (`<title>`/lang handled in A2)
- Modify: `app.d.ts` / `src/app.d.ts` if `App.Locals.session` is typed there (drop `session`; keep `requestId`, `locale`)

- [ ] **Step 1 — Failing test: BFF forwards a public GET with no Authorization.** In `src/lib/server/bff-proxy.test.ts`, replace the Bearer-injection test with:

```ts
import { describe, it, expect } from 'vitest';
import { buildProxyRequest } from './bff-proxy';

describe('buildProxyRequest (public read-through)', () => {
  it('forwards an allow-listed GET and injects no Authorization', () => {
    const original = new Request('http://localhost/api/upstream/events/nearby?lat=1&lng=2', {
      method: 'GET',
      headers: { accept: 'application/json', cookie: 'sid=secret', origin: 'http://evil' }
    });
    const req = buildProxyRequest({
      upstreamUrl: 'https://api.example.com/events/nearby?lat=1&lng=2',
      originalRequest: original,
      requestId: 'req-123',
      signal: new AbortController().signal
    });
    expect(req.headers.get('authorization')).toBeNull();
    expect(req.headers.get('cookie')).toBeNull();
    expect(req.headers.get('origin')).toBeNull();
    expect(req.headers.get('accept')).toBe('application/json');
    expect(req.headers.get('x-request-id')).toBe('req-123');
    expect(req.method).toBe('GET');
  });
});
```

- [ ] **Step 2 — Run, expect FAIL** (`buildProxyRequest` still requires `accessToken`): `bun run test src/lib/server/bff-proxy.test.ts` → FAIL.

- [ ] **Step 3 — Rewrite `bff-proxy.ts`** to the read-through shape (no token, GET body always null, cache header on the response):

```ts
/**
 * BFF proxy helpers — public read-through (no auth; ADR 0009, 0012).
 * Forwards allow-listed GETs to qarib-api, strips browser-sensitive headers,
 * propagates x-request-id, and never injects Authorization (reads are public).
 */
const ALLOWED_REQUEST_HEADERS = new Set(['accept', 'content-type', 'accept-language', 'accept-encoding']);

export function buildProxyRequest(params: {
  upstreamUrl: string;
  originalRequest: Request;
  requestId: string;
  signal: AbortSignal;
}): Request {
  const { upstreamUrl, originalRequest, requestId, signal } = params;
  const headers = new Headers();
  for (const [key, value] of originalRequest.headers.entries()) {
    if (ALLOWED_REQUEST_HEADERS.has(key.toLowerCase())) headers.set(key, value);
  }
  headers.set('x-request-id', requestId);
  return new Request(upstreamUrl, { method: 'GET', headers, signal });
}

export function buildProxyResponse(upstreamResponse: Response): Response {
  const headers = new Headers(upstreamResponse.headers);
  headers.delete('set-cookie');
  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers
  });
}
```

- [ ] **Step 4 — Run, expect PASS**: `bun run test src/lib/server/bff-proxy.test.ts` → PASS.

- [ ] **Step 5 — Rewrite the BFF route** `src/routes/api/upstream/[...path]/+server.ts` to export only `GET`, drop `validateCsrf`/`enforceAuthRateLimit`/`accessToken`, keep timeout + 502/504 handling + `buildProxyResponse`. (No import from `$core/auth`.) Set a conservative default `Cache-Control` (tune in Phase C):

```ts
import { error, type RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$core/config/index.server';
import { serverLogger } from '$core/logger/pino.server';
import { buildProxyRequest, buildProxyResponse } from '$server/bff-proxy';

const UPSTREAM_TIMEOUT_MS = 30_000;

export const GET: RequestHandler = async ({ params, request, locals }) => {
  const path = params.path ?? '';
  const requestId = locals.requestId;
  const upstreamUrl = `${serverConfig.UPSTREAM_API_URL}/${path}${new URL(request.url).search}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const upstream = await fetch(
      buildProxyRequest({ upstreamUrl, originalRequest: request, requestId, signal: controller.signal })
    );
    clearTimeout(timeout);
    return buildProxyResponse(upstream);
  } catch (cause) {
    clearTimeout(timeout);
    const aborted = cause instanceof Error && cause.name === 'AbortError';
    serverLogger.error({ requestId, path, err: String(cause) }, aborted ? 'bff: upstream timeout' : 'bff: upstream error');
    throw error(aborted ? 504 : 502, { message: aborted ? 'Upstream timeout' : 'Upstream unavailable', code: aborted ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_ERROR' });
  }
};
```

- [ ] **Step 6 — Remove `authHandle` from `src/hooks.server.ts`**: delete the `authHandle` const + its `$core/auth` import block; change the export to `sequence(requestIdHandle, paraglideHandle, securityHandle)`. Leave requestId/paraglide/security untouched.

- [ ] **Step 7 — Make `(app)` public**: delete `src/routes/(app)/+layout.server.ts`. Replace `src/routes/(app)/+page.svelte` with a minimal public placeholder (real content arrives in B/C):

```svelte
<script lang="ts">
  import { m } from '$core/i18n';
</script>
<section class="p-6">
  <h1 class="font-serif text-2xl italic text-content">{m.app_title()}</h1>
  <p class="mt-2 text-content-3">{m.app_tagline()}</p>
</section>
```

- [ ] **Step 8 — Delete dead surfaces**: `rm -rf src/routes/(auth) src/lib/core/auth e2e/auth.e2e.ts`. Remove `auth_*` keys from `messages/en.json`. Add `app_tagline` key used above (temporary; full catalog in A2). Drop `App.Locals.session` from `src/app.d.ts` (keep `requestId`, `locale`).

- [ ] **Step 9 — Identity**: `package.json` name → `qarib-web`. (Title/lang done in A2.)

- [ ] **Step 10 — Verify gates**: `bun run check && bun run lint && bun run test && bun run test:e2e && bun run build`. Expected: green. `git grep -n "core/auth\|locals.session\|validateCsrf" src/` returns nothing.

- [ ] **Step 11 — Commit**:

```bash
git add -A
git commit -m "feat: strip auth surface, public read-through BFF, fork to qarib-web

Removes (auth) routes, core/auth, the session guard, and the auth e2e; the BFF
becomes a public GET read-through (no Bearer/CSRF) per ADR 0009/0012. Renames the
package to qarib-web. (app) is now public.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

**Exit:** app boots with no auth; `(app)` is public; the BFF forwards public GETs with no Authorization; all gates + e2e green; no `core/auth` references remain.

---

## Task A2 — Locale → Bahasa Indonesia (`id`)

**Why:** ADR 0010 — single `id` locale, switcher removed, i18n layer retained.

**Files:**
- Modify: `project.inlang/settings.json` (`baseLocale: "id"`, `locales: ["id"]`)
- Create: `messages/id.json` (Qarib Bahasa catalog)
- Delete: `messages/en.json`
- Modify: `src/app.html` (`<html lang="id">`)
- Rewrite: `src/routes/+layout.svelte` (remove the locale `<select>`; reskin chrome from `bg-white/text-slate-*` → tokens `bg-surface/text-content`)
- Modify: `src/routes/+layout.server.ts` if it returns `locale` for the switch (keep locale resolution; drop switch-only data) — read it first.

- [ ] **Step 1 — Switch the locale config.** Edit `project.inlang/settings.json`: `"baseLocale": "id"`, `"locales": ["id"]`.

- [ ] **Step 2 — Author `messages/id.json`** (Bahasa; keys stay English snake_case per ADR 0007). Seed with the shell + error strings actually used (expand per phase):

```json
{
  "$schema": "https://inlang.com/schema/inlang-message-format",
  "app_title": "Qarib",
  "app_tagline": "Kajian terdekat, dalam satu ketukan.",
  "error_generic_title": "Terjadi kesalahan",
  "error_generic_body": "Terjadi kesalahan tak terduga. Coba lagi.",
  "error_request_id": "Kode permintaan: {id}",
  "api_error_network": "Tidak dapat menghubungi server. Periksa koneksimu dan coba lagi.",
  "api_error_server": "Server mengembalikan kesalahan. Coba lagi.",
  "api_error_not_found": "Data yang diminta tidak ditemukan.",
  "api_error_generic": "Terjadi kesalahan. Coba lagi."
}
```

- [ ] **Step 3 — Delete `messages/en.json`**; run codegen: `bun run i18n:compile`. (Removes the `en` bundle so `m.*` resolves against `id`.)

- [ ] **Step 4 — `app.html`**: `<html lang="id">`.

- [ ] **Step 5 — Rewrite `src/routes/+layout.svelte`**: drop the `<select>` locale switch + `setLocale`; reskin to tokens. Minimal chrome (the *app* header lands in A4; this root layout just sets background + title + renders children):

```svelte
<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';
  import { m } from '$core/i18n';
  let { children } = $props();
</script>
<svelte:head><title>{m.app_title()}</title><link rel="icon" href={favicon} /></svelte:head>
<div class="min-h-screen bg-surface text-content">{@render children()}</div>
```

- [ ] **Step 6 — Update the smoke e2e** `e2e/smoke.e2e.ts`: the "home renders the locale switch" test no longer applies — replace with "home renders the app title in Bahasa" (assert `Qarib` + tagline visible, `html[lang="id"]`).

- [ ] **Step 7 — Verify**: `bun run check && bun run lint && bun run test && bun run test:e2e && bun run build` green. `grep -rn "locale-switch\|setLocale(" src e2e` returns nothing.

- [ ] **Step 8 — Commit**: `feat(i18n): default to Bahasa (id), remove locale switch` (+ co-author trailer).

**Exit:** app renders in Bahasa, `<html lang="id">`, no switcher; i18n layer intact (adding a locale later = drop a JSON).

---

## Task A3 — First primitives (shadcn-svelte fork)

**Why:** the app shell + every page need a curated primitive set (ADR 0002, `styling.md`). Forked into `shared/primitives/`, owned by us, token-driven.

**Files (create):** `src/lib/shared/primitives/{button,icon-button,card,badge,skeleton}.svelte`, plus `back-button.svelte` and `index.ts` (barrel). Tests: `src/lib/shared/primitives/button.test.ts` (representative).

**Approach:** small, prop-light Svelte 5 components using tokens + `cn()`. Variants via `tailwind-variants` (already a dep in cms; if not present here, use a `cn()` + map). Each interactive primitive: focus ring, accessible label, keyboard support (`styling.md` a11y floor).

- [ ] **Step 1 — Failing test for `Button`** (`button.test.ts`, Vitest + `@testing-library/svelte` if present; else render-and-assert):

```ts
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Button from './button.svelte';

describe('Button', () => {
  it('renders label, applies primary variant + focus ring classes', () => {
    render(Button, { props: { variant: 'primary' }, slots: { default: 'Buka' } } as never);
    const btn = screen.getByRole('button', { name: 'Buka' });
    expect(btn.className).toMatch(/bg-primary/);
    expect(btn.className).toMatch(/focus-visible:/);
  });
});
```

- [ ] **Step 2 — Run, expect FAIL** (no `button.svelte`).
- [ ] **Step 3 — Implement `button.svelte`** (variants: `primary` = `bg-primary text-surface`, `ghost`, `outline`; sizes; `children` snippet; forwards `...rest`; focus-visible ring token). Implement the sibling primitives (`icon-button`, `card`, `badge`, `skeleton`, `back-button`) following the same shape — each prop-light, token-classed, a11y-complete. Export all from `index.ts`.
- [ ] **Step 4 — Run, expect PASS**; add a render smoke test per primitive (focus ring + variant class present).
- [ ] **Step 5 — Verify** gates green.
- [ ] **Step 6 — Commit**: `feat(ui): add base primitives (button, icon-button, card, badge, skeleton, back-button)`.

**Exit:** the primitive set renders, is token-driven, keyboard-accessible, and exported from `shared/primitives`. Reference the qarib-cms components under `qarib-cms/resources/js/lib/components/` for prior art, but **reskin to Qarib tokens** — do not copy old styling.

---

## Task A4 — App shell with two header modes

**Why:** the cross-cutting chrome (the user's "build the layout first"). Map-home gets the logo/search header; inner pages get back + title. Built once here.

**Files (create):** `src/lib/shared/composites/app-header.svelte` (modes `home` | `back`), `src/routes/(app)/+layout.svelte` (the shell), `src/routes/(app)/+error.svelte` (per-section error), shared `empty-state.svelte` / `loading-state.svelte` composites. Test: `app-header.test.ts`, and update `e2e/smoke.e2e.ts`.

**Approach:** `AppHeader` takes `mode`; `home` renders logo (`Qarib` + `قريب` accent) + a search affordance + settings icon; `back` renders `BackButton` + centered title + overflow. The `(app)` layout chooses the mode from the route: the map home (`/` or `/peta`) is `home`; everything else is `back`. Use `$page.url.pathname` (or a layout prop) to pick.

- [ ] **Step 1 — Failing test: `AppHeader` mode=back shows a back control + title; mode=home shows the brand + no back.** (`app-header.test.ts`.)
- [ ] **Step 2 — Run, expect FAIL.**
- [ ] **Step 3 — Implement `app-header.svelte`** using `BackButton`/`IconButton` primitives + tokens; brand uses `font-serif` (Fraunces) + the Arabic accent span; responsive (search collapses on narrow).
- [ ] **Step 4 — Implement `(app)/+layout.svelte`**: render `AppHeader` with the route-derived mode, then `{@render children()}`; mobile-first max-width container; safe-area padding. Implement `empty-state` + `loading-state` composites (token-driven, slot-based).
- [ ] **Step 5 — Run unit PASS; update `e2e/smoke.e2e.ts`**: home route shows the brand header (no back); a deep route (use a temporary `(app)/_probe/+page.svelte` or an existing one) shows the back header. Remove the probe before commit if added, or assert on `/` only and defer back-mode e2e to Phase C when real inner routes exist.
- [ ] **Step 6 — Verify** gates + e2e green.
- [ ] **Step 7 — Commit**: `feat(shell): app layout with home/back header modes + loading/empty/error states`.

**Exit:** `(app)` renders the correct header per route (home vs back), responsive, in Bahasa, light/dark; later pages only supply content.

---

## Task A5 — Port shared utilities (date/hijri, names, prayer) + base Zod

**Why:** domain pages (C–F) need hijri dates, Arabic name formatting, and prayer-time anchors. These are framework-agnostic and already written in qarib-cms.

**Files (create):** `src/lib/shared/utils/{date,names,prayer}.ts` + co-located `*.test.ts`. Source to port + adapt: `qarib-cms/resources/js/lib/utils/{date,names,prayer}.ts` (read them; keep the logic, drop any Inertia/Laravel coupling, match our `tsconfig`/ESLint).

**Approach:** port pure functions verbatim where possible; add Vitest unit tests covering the cases the cms relied on (hijri conversion boundaries, prayer-anchor labels like "Ba'da Maghrib", Arabic name display). Independent of A1–A4 — can run in parallel.

- [ ] **Step 1 — Read** each `qarib-cms` util; for the first (`date`/hijri), write a failing Vitest test asserting a known Gregorian→Hijri label and a prayer-anchor format.
- [ ] **Step 2 — Run FAIL → port the function → Run PASS.** Repeat per util (`names`, `prayer`).
- [ ] **Step 3 — Verify** gates green.
- [ ] **Step 4 — Commit**: `feat(utils): port hijri-date, name, and prayer-time helpers from cms`.

**Exit:** the three util modules are ported, token/markup-free, and unit-tested ≥ the cms behavior.

---

## Phase-A self-review checklist (run before opening each PR)

- [ ] Spec coverage: A1–A5 cover every Phase-A roadmap bullet (identity, strip auth, BFF, locale, shell, primitives, utils). ✅
- [ ] No `core/auth` / `locals.session` / `validateCsrf` references remain after A1.
- [ ] No hardcoded user-facing strings outside `messages/id.json` (`i18n.md`).
- [ ] No arbitrary token values; semantic tokens (`bg-surface`/`text-content`) used (`styling.md`).
- [ ] Each PR: green `check`/`lint`/`test`/`build` (+ `test:e2e` where routes changed), independent `reviewer` pass, ADR/rule cross-refs where a constrained surface changed.

## Out of scope (Phase A)

Map/Leaflet, any domain data fetching, landing page (Phase B), the real `(app)` home content (Phase C). No new deps beyond what primitives need (`tailwind-variants` if not already present — record in `dependencies.md`).
