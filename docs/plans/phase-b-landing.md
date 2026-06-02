# Phase B — Landing Implementation Plan

> **For agentic workers:** use `superpowers:subagent-driven-development` — one task = one worktree + PR, implementer → spec review → quality review → ship. Steps use `- [ ]`.

**Goal:** The public "get to know us" landing at `/` — the approved **A+C fused hero** + marketing sections, in Bahasa, design-faithful, static (no data).

**Architecture:** A new `(marketing)` route group owns `/` with its **own chrome** (a marketing nav, distinct from the `(app)` shell + its AppHeader). The Phase-A `(app)/+page.svelte` placeholder is **removed** — the app's home becomes `/peta` in Phase C, so only the marketing landing serves `/` (two `+page.svelte` at root = SvelteKit error, so the placeholder must go).

**Tech:** SvelteKit 2, Svelte 5 runes, Tailwind v4 tokens (`src/app.css`), A3 primitives. No new deps (icons = inline SVG). i18n via Paraglide (`messages/id.json`).

**Design source (in-repo, durable):** `docs/design/landing-reference.jsx` + `docs/design/landing-reference.css` — the approved prototype. Translate its **markup/copy** to Svelte + **our** semantic tokens (`bg-surface`, `text-content`, `text-primary`, `font-serif`, `font-arabic`, etc.). Decisions: **A+C fused hero** (editorial copy over a map backdrop with pulsing pins), **NO trust badges**, Arabic = light accent (`قريب`). The hero map is **decorative CSS only** (gradient + animated pins) — the real Leaflet map is Phase C.

**Gates per task PR:** `bun run check && lint && test && test:e2e && build` green.

**Task order:** B1 (chrome + routing + hero) → B2 (sections). B2's sections append to B1's page.

---

## Task B1 — Marketing chrome, routing restructure, A+C hero

**Files:**
- Delete: `src/routes/(app)/+page.svelte` (Phase-A placeholder).
- Create: `src/routes/(marketing)/+layout.svelte` — marketing nav.
- Create: `src/routes/(marketing)/+page.svelte` — renders `<Hero />` (sections come in B2).
- Create: `src/lib/shared/marketing/hero.svelte`.
- Modify: `src/lib/shared/composites/header-mode.ts` — drop `'/'` from `HOME_PATHS` (only `/peta` is the app home now); update `header-mode.test.ts` (`/`→'back' no longer asserted as home; assert `/peta`→'home', `/kajian/x`→'back').
- Modify: `messages/id.json` — add the B1 copy keys; `bun run i18n:compile`.
- Modify: `e2e/smoke.e2e.ts` — `/` now renders the landing.

**Marketing nav** (`(marketing)/+layout.svelte`): sticky top bar — brand `Qarib` (`font-serif text-primary`) + `قريب` (`font-arabic text-content-3`); anchor links `Cara kerja` (`#cara-kerja`) + `Fitur` (`#fitur`); a primary `Button` "Buka Qarib" → `/peta` (use `resolve('/peta')` from `$app/paths`). Renders `{@render children()}` below. Mobile: links may collapse; keep the brand + CTA.

**Hero** (`hero.svelte`) — A+C fusion, mobile-first:
- Left/foreground: eyebrow (dot + `m.landing_eyebrow()`); headline `<h1>` with `m.landing_hero_kajian()` in `font-serif italic text-primary` + rest of `m.landing_hero_headline()`; lede `m.landing_hero_lede()`; CTA row — primary `Button` `m.landing_cta_primary()` → `resolve('/peta')`, secondary ghost `Button` `m.landing_cta_secondary()` → `#cara-kerja`. **No trust badges.**
- Background/right: a **decorative** map backdrop (CSS radial-gradient per `landing-reference.css` `.map-bg`) with 3–4 absolutely-positioned **pulsing pin dots** (`@keyframes` pulse; one larger "hero" pin with a mosque glyph). Copy sits over a `linear-gradient(to right, surface 65%, transparent)` so text stays legible (per `.map-hero .map-copy`). Decorative SVG/markup gets `aria-hidden`.

**Copy → `messages/id.json` keys** (Bahasa, exact):
```
landing_nav_how: "Cara kerja"
landing_nav_features: "Fitur"
landing_nav_open: "Buka Qarib"
landing_eyebrow: "Qarib · dekat denganmu"
landing_hero_kajian: "Kajian"
landing_hero_headline: "terdekat, dalam satu ketukan."
landing_hero_lede: "Temukan jadwal kajian di masjid sekitarmu — tanpa perlu bertanya, tanpa perlu akun. Klik, lihat, datangi."
landing_cta_primary: "Temukan kajian terdekat"
landing_cta_secondary: "Lihat cara kerjanya"
```
(Headline renders as: *Kajian* [serif italic] terdekat, dalam satu ketukan.)

- [ ] Step 1 — TDD `header-mode.ts`: update test (`/`→'back', `/peta`→'home') → run (fail) → drop `'/'` from `HOME_PATHS` → run (pass).
- [ ] Step 2 — Routing: delete `(app)/+page.svelte`; create `(marketing)/+layout.svelte` (nav) + `(marketing)/+page.svelte` (renders `<Hero />`).
- [ ] Step 3 — Build `hero.svelte` per above; add the i18n keys + `bun run i18n:compile`.
- [ ] Step 4 — Update `e2e/smoke.e2e.ts`: `/` shows the hero headline (heading containing "terdekat") + the nav brand link + the "Buka Qarib" CTA; `html[lang="id"]`.
- [ ] Step 5 — Gates green; commit:
```
feat(landing): marketing chrome, routing, and A+C hero

Adds the (marketing) route group owning `/` with its own nav; removes the
Phase-A (app) placeholder (app home moves to /peta in C). A+C fused hero —
editorial copy over a decorative pulsing-pin map backdrop. No trust badges.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

**Exit:** `/` renders the marketing landing (nav + A+C hero + CTA to `/peta`) in Bahasa, light/dark, responsive, a11y; gates green. Sections arrive in B2.

---

## Task B2 — Landing sections (Problem · Features · CTA · Footer)

**Files (create under `src/lib/shared/marketing/`):** `problem.svelte`, `features.svelte`, `footer-cta.svelte`, `site-footer.svelte`. **Modify:** `(marketing)/+page.svelte` (append the four after `<Hero />`); `messages/id.json` (+keys, compile); `e2e/smoke.e2e.ts` (assert sections + anchors).

**Problem** (`id="kenapa"` / anchor target `#cara-kerja` lives here or in Features — wire the nav anchors to real `id`s): centered; eyebrow `m.landing_problem_eyebrow()`; `<h2>` `m.landing_problem_title()` (emphasis word in `font-serif italic text-primary`); `<p>` `m.landing_problem_body()`.

**Features** (`id="fitur"`): eyebrow `m.landing_features_eyebrow()`; `<h2>` `m.landing_features_title()`; a 3-card grid using the **Card** primitive — each: an inline SVG icon (map / calendar / user — copy from `landing-reference.jsx` `svg.map/calendar/user`), `<h3>`, `<p>`. Cards: Peta kajian / Kalender per masjid / Kenali ustadznya.

**FooterCTA** (`id="cara-kerja"` or its own): `<h2>` `m.landing_cta_title()`; `<p>` `m.landing_cta_body()`; primary `Button` `m.landing_cta_open_browser()` → `resolve('/peta')`; two "coming soon" store badges (`m.landing_store_soon()` + App Store / Google Play, inline SVG from reference, non-interactive/`aria-disabled`).

**SiteFooter**: brand; `m.landing_footer_copy()`; dua line `بارك الله فيكم` + `m.landing_footer_dua()`; links `Kebijakan privasi` / `Kontak` (`href="#"` placeholders for now — real pages later).

**Copy → keys** (Bahasa, from `landing-reference.jsx`):
```
landing_problem_eyebrow: "Kenapa Qarib"
landing_problem_title: "Mencari kajian seharusnya tidak serumit mencari alamat."   (emphasis: "tidak serumit")
landing_problem_body: "Info kajian tersebar di banyak grup WhatsApp, story Instagram, dan pengumuman masjid. Banyak yang terlewat. Qarib mengumpulkan semuanya di satu peta — kamu tinggal lihat, pilih, datang."
landing_features_eyebrow: "Fitur"
landing_features_title: "Semua yang kamu butuhkan, tidak lebih."
landing_feature_map_title: "Peta kajian"
landing_feature_map_body: "Lihat kajian yang sedang dan akan dimulai di sekitarmu. Pin berwarna menandai urgensi — yang paling dekat waktu, yang paling dekat lokasi."
landing_feature_calendar_title: "Kalender per masjid"
landing_feature_calendar_body: "Rencanakan pekan. Buka detail masjid untuk melihat seluruh jadwal kajian rutinnya — bukan cuma hari ini."
landing_feature_ustadz_title: "Kenali ustadznya"
landing_feature_ustadz_body: "Profil singkat ustadz, spesialisasi, dan kajian aktif yang beliau isi. Supaya kamu tahu siapa yang akan menyampaikan."
landing_cta_title: "Kajian terdekat menunggu. Buka sekarang."   (emphasis: "terdekat")
landing_cta_body: "Tanpa akun. Tanpa unduh. Langsung buka dan jalan."
landing_cta_open_browser: "Buka Qarib di browser"
landing_store_soon: "Segera di"
landing_footer_copy: "© 2026 · Dibuat untuk ukhuwah."
landing_footer_dua: "semoga bermanfaat."
landing_footer_privacy: "Kebijakan privasi"
landing_footer_contact: "Kontak"
```

- [ ] Step 1 — Build the four section components per above (Card for features; inline SVGs from the reference).
- [ ] Step 2 — Append them to `(marketing)/+page.svelte`; wire the nav anchors (`#cara-kerja`, `#fitur`) to the matching section `id`s.
- [ ] Step 3 — Add i18n keys; `bun run i18n:compile`.
- [ ] Step 4 — e2e: assert Features cards + the FooterCTA "Buka Qarib di browser" → `/peta`, and a nav anchor scrolls to its section.
- [ ] Step 5 — Gates green; commit `feat(landing): problem, features, CTA, and footer sections`.

**Exit:** the full landing renders top-to-bottom (hero → problem → features → CTA → footer), design-faithful on the locked tokens, Bahasa, responsive, a11y ≥ 95; nav anchors + CTAs work.

---

## Self-review (before each PR)
Spec coverage vs the reference; no hardcoded user-facing strings (all `m.*`); no arbitrary token values; one `<main>` per page; nav/CTA use `resolve(...)`; decorative map is `aria-hidden`; no new deps.

## Out of scope (Phase B)
Real Leaflet map (C) · `/peta` + any app/domain page (C) · privacy/kontak pages · search.
