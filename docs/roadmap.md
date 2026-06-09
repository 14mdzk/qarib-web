# Roadmap — Qarib (web)

Vertical-slice delivery. Each phase ends in a **merged PR with green gates**
(`check` / `lint` / `test` / `build`) and a `CHANGELOG.md` entry. App-shell
first, then each domain slots into it.

Two tiers of detail, on purpose:

- **This roadmap** = every phase decomposed into its task checklist + intent +
  exit criteria — enough to grasp *what*, *why*, and *roughly how* across the
  whole MVP.
- **`docs/plans/<phase>.md`** = the exhaustive step-by-step (files, functions,
  tests, order) for the phase about to be built, written **just-in-time** via the
  writing-plans skill so it is accurate when executed — not stale on arrival.
  Each task there carries **Intent · How · Action · Done-when**.

Dependencies: **A** unblocks everything. **B** (landing) is independent of the
app shell. **C** (events/map) is the core and is reused by **D/E/F**.

---

## Phase 0 — Foundation primitives ✅ (landed)

Already merged (qarib-web #1, qarib-api #30):

- [x] Design tokens + semantic dark layer + self-hosted fonts (`src/app.css`).
- [x] OpenAPI codegen wired against the real qarib-api spec → `src/lib/generated/upstream.ts`; `auth.session` repointed to `/users/me`.
- [x] qarib-api spec corrections (nullable localized strings, error enum, status description).

---

## Phase A — Fork-time foundation + App Shell ✅ (landed)

**Goal:** make this repo *Qarib* (not the boilerplate), remove the surfaces v1
does not use, and build the chrome every browse page slots into — so later
phases add content, never re-invent the frame.

- [x] **Docs / identity**: this charter + roadmap + ADRs 0009-0012; replace `${PROJECT_NAME}` → `Qarib` across `docs/`, `CLAUDE.md`, `package.json`.
- [x] **Strip the unused auth surface** (ADR 0009): remove `(auth)/login`, `(auth)/logout`, the session guard in `(app)/+layout.server.ts`, auth e2e specs; simplify `hooks.server.ts` (drop session resolution + auth-CSRF; keep CSP, request-id, `handleError`); simplify the BFF (`api/upstream/[...path]`) to a **public read-through** proxy (forward GET, strip client cookies, add request-id + cache headers, no Bearer). Supersede `auth-and-session.md` scope via ADR.
- [x] **Locale → `id`** (ADR 0010): default locale `id`; ship `messages/id.json`; remove the old English picker (keep the i18n layer + facade).
- [x] **App shell** (`(app)/+layout.svelte`): two header modes — `MTopBar` (logo + search) for the map home, `MTopBarBack` (back + title + overflow) for inner pages; route decides the mode. Responsive nav. Shared `loading` / `error` / `empty` states.
- [x] **First primitives** (forked shadcn per ADR 0002, under `shared/primitives`): `Button`, `IconButton`, `Card`, `Badge`/`Pill`, `Skeleton`; shell pieces `Header`, `BackButton`.
- [x] **Port shared utils from qarib-cms** (reskinned to tokens): `date`/hijri, `names` (Arabic), `prayer`; base Zod schemas. (`cn` already present.)
- [x] **Tests**: unit for header-mode logic + primitives; e2e smoke (shell renders, header switches by route, `id` copy, light/dark).

**Exit:** a blank `(app)` route renders the correct header per route, in Bahasa,
light/dark, responsive; the auth surface is gone; all gates green.
Detailed plan: `docs/plans/phase-a-foundation.md`.

---

## Phase B — Landing ✅ (landed)

**Goal:** the warm "get to know us" surface — the approved **A+C fused hero**.

- [x] Route `/` with **landing chrome** (marketing nav: logo + *Cara kerja* / *Fitur* / *Buka Qarib*) — distinct from the app shell.
- [x] Translate `landing.jsx` → Svelte: fused **Editorial × Map-as-hero** hero (editorial copy over a map with pulsing pins; a static map snapshot is fine for v1), Problem section, Features (3 cards), Footer CTA (**no trust badges**), footer with dua.
- [x] Fraunces italic emphasis; Arabic accent (`قريب`) per the locked design.
- [x] Wire *Buka Qarib* → `/peta`.
- [x] All copy through i18n (`id`).
- [x] **Tests**: e2e (landing renders, CTA routes to `/peta`); a11y ≥ 95.

**Exit:** `/` matches the approved landing on the locked tokens, light/dark,
responsive, a11y ≥ 95.

---

## Phase C — Events / map  *(the core hook)* ✅ (landed)

**Goal:** the actual product — nearby kajian on a map, plus list and detail.

- [x] `domains/events`: **schema** (occurrence `EventRecurring` + `EventSeries`, from generated types + Zod at boundaries), **service** (typed client: `/events`, `/events/nearby`, `/events/:id`, `/events/series/:slug` (+`/upcoming`, `/recurrings`)), **queries** (svelte-query keys + **cursor** pagination — composite cursors for nearby), **store** (map filters + geolocation + selected pin, context-DI runes).
- [x] **`MapView` composite**: Leaflet **client-only island** + Stadia/Stamen styled tiles (key via env), pins with **tier styling** (port `pinTierService` from cms), user-location dot, bottom-sheet/callout.
- [x] Route **`/peta`** (map home, `MTopBar`, no back): full-bleed map, date/tema/radius filters, nearby feed by `lat`+`lng`, browser geolocation, and default Cirebon behavior when GPS is denied or unavailable. Manual `region_id` selection remains planned in Phase C.1.
- [x] Route **`/kajian/[id]`** (detail, `MTopBarBack`): time + prayer anchor, venue, ustadz, subject, status (Incoming/Ongoing/Cancelled/Rescheduled/Completed = 0/1/10/11/99).
- [x] **Phase C edge-case follow-up**: full-bleed map, floating date/tema/radius filters capped at 60 km, local-calendar month grid, denied/unavailable and empty-state center popups, neutral nearby place-only pins linking to tempat detail, future-place suggestions, and custom Leaflet controls. The approved region/city replacement is planned, not shipped, in `docs/plans/location-onboarding-settings.md`.
- [x] **Tests**: service/store/schema unit (MSW), e2e (open `/peta` → pins → open a kajian).

**Exit:** a visitor opens `/peta`, sees nearby kajian pins, filters by date/tema,
and opens a kajian detail — all SSR, all public.

---

## Phase C.1 — Location onboarding, timezone, and settings 📋 (planned)

**Goal:** require an explicit GPS or province-city choice before public app
browsing, keep calendar queries in the browser timezone, and expose location
settings from every app header.

Detailed plan: `docs/plans/location-onboarding-settings.md`.

**PR1 — browser timezone contract**

- [ ] Remove server-host-derived calendar days from app queries.
- [ ] Build date boundaries as explicit-offset RFC3339 in the browser timezone.
- [ ] Verify DST and non-Jakarta browser timezone behavior.

**PR2 — onboarding and settings**

- [ ] Gate every `(app)` route with a privacy-preserving completion marker;
      keep `/` and `/lokasi` ungated.
- [ ] Add first-run and replacement `/lokasi?returnTo=...` flows with safe
      same-origin return validation.
- [ ] Recover missing completion markers from valid saved preferences, and force
      re-selection when marker exists but client preference is missing/invalid.
- [ ] Persist a versioned GPS/manual preference client-side without coordinates
      in cookies.
- [ ] Add province-city selection and require manual city after denied GPS.
- [ ] Enforce GPS coordinate queries XOR manual `region_id` queries.
- [ ] Keep GPS radius choices at 10/15/25/40/60 km, default 10 km.
- [ ] Add accessible mobile bottom-sheet and desktop-modal settings to every app
      header, with `Ganti lokasi` and no delete/language controls.
- [ ] Complete unit, component, e2e, accessibility, docs, and release-note gates.

**Exit:** first-run visitors cannot enter app routes without a valid location
choice; returning visitors can replace or cancel location changes; all
location-dependent queries use the approved timezone and query contracts.

---

## Phase D — Places (tempat) ✅ (landed & generalized)

**Goal:** venue detail + the venue's kajian calendar.

- [x] `domains/places`: schema/service/queries (`/places`, `/places/:id`).
- [x] Route **`/tempat/[id]`**: venue info, mini-map, **upcoming kajian** (reuse the events service + `EventCard`).
- [x] **Tests**: service unit + e2e.

**Exit:** from a kajian or a map pin, a user opens the venue page and sees its upcoming kajian calendar.

---

## Phase E — Ustadz (asatidz) ✅ (landed)

**Goal:** teacher profile + their active kajian.

- [x] `domains/asatidz`: schema/service/queries (`/asatidzs`, `/asatidzs/:id`).
- [x] Route **`/ustadz/[id]`**: profile (name, alias, bio, specialization), active kajian (events filtered by `asatidz_id`).
- [x] **Tests**: service unit + e2e.

**Exit:** open an ustadz → profile + the kajian they teach.

---

## Phase F — Subjects (tema) + search 🔄 (in progress)

**Goal:** browse by topic and find things.

- [x] `domains/subjects`: schema/service/queries (`/subjects`, `/subjects/:id`).
- [x] Route **`/tema/[id]`**: subject + its kajian (events by `subject_id`).
- [ ] Route **`/cari`**: search across kajian / tempat / ustadz / tema (api filters where available).
- [ ] **Tests**: service unit + e2e (search returns + navigates).

**Exit:** browse by tema and search both work end-to-end.

---

## Per-phase definition of done

Every phase PR satisfies `.claude/rules/definition-of-done.md`: layer hygiene,
no module-singleton stores, no hand-rolled fetch outside `core/api`, no
user-facing string outside i18n, tests (unit + e2e where it touches a critical
flow), green gates, docs/ADR updated when a constrained surface changes.

## Workflow

Per phase: feature branch + **git worktree**, file-isolated dispatched agents,
**independent `reviewer`** (+ `devils-advocate` on design/architecture-affecting
PRs), PR with the completed task checklist, then merge. See
`.claude/rules/agent-dispatch.md`.

## Out of scope until later

User accounts/favorites/follow · native mobile · multi-locale (en/ar) · realtime channels · any write path · content authoring (CMS owns it).
