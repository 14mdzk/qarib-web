# Charter — Qarib (web)

## What this is

Qarib's public **web app**: a no-account, map-first way to discover **kajian**
(Islamic study sessions) happening nearby — and the **masjid** (places),
**asatidz** (ustadz), and **tema** (subjects) behind them. It is the first
surface real users meet. Native mobile comes later.

This repository was forked from the **surfaceit** SvelteKit boilerplate (which
stays upstream at `14mdzk/surfaceit`). **From this point on, this repo is the
Qarib product**, not a reusable starting point — the boilerplate's "do not
become a product" non-goal is intentionally retired here (see ADR 0009-0012).
`${PROJECT_NAME}` is replaced by `Qarib` throughout.

It consumes **qarib-api** (Go, hexagonal) over **public, read-only** HTTP.
Content is authored elsewhere — the Laravel/Filament CMS is the single source of
truth (qarib-api ADR-008). Qarib-web only reads and presents; it never writes.

## Why this exists

The product promise is on the landing itself: *"Kajian terdekat, dalam satu
ketukan — gratis, tanpa akun, tanpa unduh."* The wedge is a **browser app a
visitor can open and use immediately**, with native apps marketed as "Segera"
(later). Shipping web-first lets users get to know Qarib now instead of waiting
on a mobile build.

The data already exists (qarib-api is built and verified). What was missing is
how we **present** it. This app is that presentation layer.

## Goals

1. **Public, no-account browse.** Every user-facing flow works with zero login.
   No session, no per-user state in v1.
2. **Map-first discovery.** The core experience is "see kajian pins near me,"
   backed by `qarib-api`'s spatial `/events/nearby` feed.
3. **Bahasa Indonesia first.** Single `id` locale, but every string flows
   through the i18n layer so a second locale is later a JSON drop, not a refactor.
4. **SSR + a thin read-through BFF.** SvelteKit server routes proxy `qarib-api`
   so the browser never talks to upstream directly; tokens are irrelevant (reads
   are public) but caching, header hygiene, and request-id still flow here.
5. **Codegen-typed contract.** Types come from `qarib-api`'s OpenAPI spec via
   `openapi-typescript`; hand-written Zod only at trust boundaries.
6. **Design fidelity.** The warm landing identity (Plus Jakarta Sans + Fraunces,
   orange + cream paper, the locked tokens) is the single visual lever. Ported
   CMS components get reskinned to these tokens, never their old styling.
7. **Incremental, shippable phases.** Each roadmap phase ends in a merged PR with
   green gates — never a long no-ship stretch.

## Non-goals (v1)

- **User accounts / auth.** No login, signup, favorites, or "follow an ustadz."
  The marketed promise is "tanpa akun." Revisit post-MVP. (ADR 0009)
- **Content authoring / admin.** That is the CMS (Filament). Qarib-web is read-only.
- **Native mobile.** Responsive web only. Capacitor/Tauri is a later decision.
- **Multi-locale.** `id` only for v1; en/ar deferred. (ADR 0010)
- **Realtime / SSE.** Kajian schedules are not live-tickers; plain SSR + cache.
- **Write paths of any kind** (attendance, reviews, submissions).

## Success criteria

Qarib-web v1 succeeds when a visitor can, **without an account**:

1. Land on a warm, on-brand page that explains Qarib in seconds.
2. Open the map and see kajian happening near them (pins, tiers by urgency/distance).
3. Open a kajian → see time, masjid, ustadz, subject.
4. Open a masjid → see its kajian calendar; open an ustadz → see their profile and
   active kajian; browse by tema.
5. Do all of the above in Bahasa, on a phone-sized screen, with no blank flashes (SSR).
6. Lighthouse a11y ≥ 95 on the landing and the map shells; bundle within budget.

## Architecture at a glance

```
browser ──▶ qarib-web (SvelteKit SSR + read-through BFF) ──▶ qarib-api (Go, public reads)
                                                              ▲
                              Laravel/Filament CMS ───────────┘  (authors content; not in the user path)
```

- `src/lib/core/*` — framework primitives (api registry, query, i18n, config, logger). Reused as-is.
- `src/lib/domains/<events|places|asatidz|subjects|regions>/*` — one slice per qarib-api module.
- `src/lib/shared/{primitives,composites}` — forked shadcn primitives + Qarib composites (MapView, EventCard, Paginator…).
- `src/routes/(app)/*` — public, unguarded browse routes. `src/routes/api/upstream/*` — the BFF proxy.

## Glossary

- **Kajian** — an Islamic study session. In qarib-api, an `Event` (series) materializes into `EventRecurring` occurrences; clients mostly consume occurrences.
- **Masjid / Place** — venue. **Asatidz / Ustadz** — the teacher (`asatidz` endpoints). **Tema / Subject** — topic (Aqidah, Fiqh, Tafsir, Hadits…).
- **BFF** — `src/routes/api/upstream/**`: same-origin proxy to qarib-api. In v1 it forwards public reads (no Bearer), strips client headers, adds request-id, sets cache headers.
- **Core / Domain / Shared / Server-only** — see `docs/architecture/overview.md`.
