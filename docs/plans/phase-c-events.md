# Phase C — Events / Map Implementation Plan

> **For agentic workers:** use `superpowers:subagent-driven-development` — one task = one worktree + PR, implementer → spec review → quality review → ship. Steps use `- [ ]`.

**Goal:** The core product — **nearby kajian on a map + list + detail**, off `qarib-api`'s public read endpoints.

**Architecture:** An `events` domain (typed client via `core/api` registry → svelte-query, **cursor** pagination) feeds a **Leaflet client-only `MapView`** (Stadia raster tiles **proxied through the BFF** so `STADIA_API_KEY` stays server-side — ADR 0013). Routes: `/peta` (map home, replaces the placeholder) + `/kajian/[id]` (detail). Event pins get coordinates via `/events/nearby?expand=place`; place-only pins come from `/places` with nearby filters. Geolocation denial/unavailable falls back to the default Cirebon center; full region/city picker is intentionally split into a later PR.

**Locked facts (from generated types + qarib-api `docs/features/events.md`):**
- Occurrence `EventRecurringResponse`: `id` (int64), `event_id` (uuid), `name`/`description` (L10n, nullable override), `asatidz_id`/`place_id` (nullable override), `date_start`/`date_end`, `date_prayer` (int), `status` (int), `going_count`, `distance_km` (nearby distance-mode only). With `expand=place,asatidz` the place (with `lat`/`lng`/`name`/`address`) + asatidz embed on each item — **the implementer must confirm the exact embedded field name in `src/lib/generated/upstream.ts`**.
- **Status enum:** `Incoming=0, Ongoing=1, Cancelled=10, Rescheduled=11, Completed=99`.
- **`/events/nearby`:** `lat`+`lng` or `region_id`; `radius_km`; `subject_id?`; `date_from?`/`date_to?`; `limit?`; `cursor?`; `expand?`. Forward-only cursor. `/peta` currently uses `lat`+`lng`; region/city selection is follow-up scope.
- **Envelope/pagination:** `{success, data, pagination:{next_cursor, prev_cursor, has_more, has_prev, total?}}` — unwrapped at `core/api`. Cursor-based; **never** offset.
- **Time display = `HH:mm` with a colon** (`18:00`), per the Hi-Fi mockups.

**Tech:** SvelteKit 2, Svelte 5 runes, `@tanstack/svelte-query` (present), **Leaflet** (NEW dep — C2), Zod, design tokens, A3 primitives, A4 shell. **Port from qarib-cms** (reskin to tokens, adapt to context-DI per `state-management.md`): `resources/js/lib/services/{nearby.service,pinTierService}.ts`, `resources/js/lib/stores/{location,mapFilters,nearby}.svelte.ts`.

**Task order + deps:** C1 (data layer — no map/key) → C2 (tile proxy + MapView — adds Leaflet) → C3 (`/peta` — needs C1+C2) → C4 (`/kajian/[id]` — needs C1).

**Gates per task PR:** `check` (0/0) · `lint` · `test` · `test:e2e` · `build`.

---

## Task C1 — Events domain: registry, schema, service, queries (data layer, no UI)

**Files:**
- Modify: `src/lib/core/api/endpoints.ts` — add event endpoints to the registry (typed off `paths`).
- Create: `src/lib/domains/events/{schema.ts, service.ts, queries.ts, index.ts}` + `*.test.ts`.
- Modify: `src/lib/shared/utils/date.ts` — make `formatTime` emit a **colon** (`HH:mm`, e.g. via `Intl` `en-GB` 24h or manual pad) so event times read `18:00`; keep `getRelativeDateLabel` using it. Update `date.test.ts` (assert `/^\d{2}:\d{2}$/`).

**Registry entries** (`<domain>.<action>`, BFF-relative paths, cursor/query via path builder):
- `events.nearby` — GET `/events/nearby` — args `{ lat?, lng?, region_id?, radius_km?, subject_id?, date_from?, date_to?, limit?, cursor?, expand? }` → `EventRecurringResponse[]` + pagination.
- `events.list` — GET `/events` — args `{ event_id?, place_id?, asatidz_id?, subject_id?, status?, date_from?, date_to?, limit?, cursor?, expand? }`.
- `events.get` — GET `/events/{id}` — args `{ id: number, expand? }`.
- `events.series` — GET `/events/series/{slug}` — args `{ slug }`.
- `events.seriesUpcoming` / `events.seriesRecurrings` — GET those paths — args `{ slug, limit?, cursor? }`.

- [x] Step 1 — TDD `formatTime` → colon: update `date.test.ts` to assert a colon, run (fail), change `formatTime`, run (pass).
- [x] Step 2 — Add the registry entries; `bun run check` confirms the path keys resolve against `paths`.
- [x] Step 3 — `schema.ts`: re-export the generated occurrence/series types; add a Zod parser for the nearby item **including the expanded `place` shape** (`{ lat:number, lng:number, name, address? }`) used for pins; a small `eventStatus` enum map + a `statusLabel`/`isUpcoming` helper.
- [x] Step 4 — `service.ts`: the only `api()` caller for events (nearby/list/get/series…). TDD with MSW: nearby returns parsed occurrences; a `success:false` envelope throws `ApiError`.
- [x] Step 5 — `queries.ts`: svelte-query keys + `defineQuery`/`defineMutation`; a cursor-paginated nearby query (infinite-style using `pagination.next_cursor` / `has_more`). Test the key shape + the cursor accumulation logic (pure).
- [x] Step 6 — `index.ts` barrel. Gates green. Commit `feat(events): events domain data layer (registry, schema, service, cursor queries)`.

**Exit:** a (headless) caller can fetch + type nearby occurrences and paginate by cursor; times format as `HH:mm`. No map, no route.

---

## Task C2 — BFF tile proxy + MapView composite

**Files:**
- Create: `docs/decisions/0013-map-tile-bff-proxy.md` (already added with this plan PR — reference it).
- Modify: `src/lib/core/config/schema.ts` + `index.server.ts` — add `STADIA_API_KEY` (server-only, required when the map is used).
- Create: `src/routes/api/tiles/[...tile]/+server.ts` — GET proxy → Stadia, injecting `STADIA_API_KEY`, with a long `Cache-Control`.
- Modify: `package.json` — add `leaflet` + `@types/leaflet` (record rationale in `docs/decisions/dependencies.md`).
- Create: `src/lib/shared/composites/map-view.svelte` (Leaflet **client-only island**) + `src/lib/domains/events/pin-tier.ts` (port `pinTierService` from cms) + `pin-tier.test.ts`.

- [x] Step 1 — `STADIA_API_KEY` into the config schema (server-only) + `index.server.ts` import.
- [x] Step 2 — TDD the tile proxy (`src/lib/server/tile-proxy.ts` helper, unit-tested like `bff-proxy`): builds the Stadia URL with the key from `serverConfig`, strips client headers, returns a `Cache-Control: public, max-age=...` response. Then the `+server.ts` GET handler uses it. Stadia URL form: `https://tiles.stadiamaps.com/tiles/<style>/{z}/{x}/{y}{r}.png?api_key=<KEY>` — pick a **warm** style (e.g. `alidade_smooth` or `stamen_toner_lite`); the route maps `/api/tiles/{z}/{x}/{y}{@2x}.png` → upstream. **Key never reaches the client.**
- [x] Step 3 — Port `pin-tier.ts` (urgency/distance → tier; map tier → a token color) from `qarib-cms/resources/js/lib/services/pinTierService.ts`; unit-test the tiering.
- [x] Step 4 — `map-view.svelte`: import Leaflet in `onMount` only (client-only; never SSR). Props `{ center, zoom, pins: {id,lat,lng,tier}[], userLocation? }`; tile layer → `/api/tiles/...`; pins as `divIcon` styled with tier token colors + a 🕌 hero/cluster style; user-location dot; dispatch a `pinclick` event with the id. Honor `prefers-reduced-motion`. Guard against double-init.
- [x] Step 5 — Gates green. Commit `feat(map): BFF Stadia tile proxy + Leaflet MapView composite`.

**Exit:** `MapView` renders warm Stadia tiles with tier-styled pins; `STADIA_API_KEY` is absent from the client bundle (verify `bun run build` output / grep `.svelte-kit/output/client` for the key → none).

---

## Task C3 — `/peta` map home

**Files:**
- Replace: `src/routes/(app)/peta/+page.svelte` (the coming-soon placeholder) + add `+page.ts` (load the nearby feed).
- Create: `src/lib/domains/events/components/event-card.svelte` (+ test), and the UI stores ported as **context-DI** (`state-management.md`): `domains/events/store.svelte.ts` (map filters + selected pin) and a `core` location service (geolocation) — port/adapt `qarib-cms` `location.svelte.ts`/`mapFilters.svelte.ts`/`nearby.svelte.ts` (NO module singletons — factory + `setContext`).
- Modify: `messages/id.json` (+ peta UI strings; replace the `peta_soon_*` placeholder copy).

- [x] Step 1 — Geolocation: a `createLocation()` context service — request permission; expose `coords | null` + `status`; on deny/unavailable → caller keeps the map alive on the default Cirebon center and shows a centered popup with "Pakai Cirebon" / "Coba GPS lagi".
- [x] Step 2 — `event-card.svelte`: time (`HH:mm`) + prayer anchor (`getPrayerLabel`) + title (occurrence name → series fallback) + masjid + `distance_km` (`formatDistance`) + a status `Badge`. TDD any pure formatting.
- [x] Step 3 — `/peta/+page.svelte`: full-bleed map (MapView), floating date/tema/radius filters, nearby event query by `lat`+`lng`, nearby place query for masjid without today's event, custom date picker, radius steps `10 → 15 → 25 → 40 → 60`, pin-click → PinSheet for today events or `/tempat/[id]` for place-only pins. Map-home header (A4 home mode).
- [x] Step 4 — e2e: with MSW stubbing `/api/upstream/events/nearby`, `/peta` renders pins + list; clicking an event navigates to `/kajian/[id]`.
- [x] Step 5 — Gates green. Commit `feat(peta): nearby-kajian map home (map+list, filters, geolocation)`.
- [x] Step 6 — **Post-implementation: Component z-index adjustments** — Fixed z-index layers on the Map page and its composite overlays. Updated `PinSheet`, `MapFab`, and `MapFilterChips` styling from lower values (`15` / `20`) to `999` to display them on top of Leaflet map tiles (which default to layer index of 400). Updated related overlays/loading states/empty/error templates and the scrim button to `999`/`998` values accordingly.
- [x] Step 7 — **Post-implementation: Edge-case UX reconciliation** — Centered location/error/empty popups over the live map; replaced native custom-date input with a local-calendar month-grid picker; added radius config sheet and capped radius at 60 km; merged `/places` nearby results into neutral place-only pins so masjid without today's kajian still appear without claiming a proven future event; deduped future-place summary counts by `event_id` so repeated occurrences do not inflate "kajian" counts.

**Exit:** a visitor opens `/peta`, sees nearby kajian and masjid pins, filters by date/tema/radius, and opens a kajian or tempat — public, SSR shell + client map island.

---

## Task C4 — `/kajian/[id]` detail

**Files:** Create `src/routes/(app)/kajian/[id]/+page.svelte` + `+page.ts` (load `events.get` with `expand=place,asatidz`). Modify `messages/id.json` (+detail strings).

- [x] Step 1 — `+page.ts` load: `events.get({ id, expand: 'place,asatidz' })`; 404 → SvelteKit `error(404)`.
- [x] Step 2 — `+page.svelte` (back-mode header, title = kajian name): hero (name + subject badge + status), date/time (`HH:mm`) + prayer anchor, masjid card (name, address, link to `/masjid/[id]` — placeholder until D), ustadz card (name, link to `/ustadz/[id]` — placeholder until E). Reuse `event-card` pieces where sensible.
- [x] Step 3 — e2e: open a stubbed kajian → detail renders; back nav returns.
- [x] Step 4 — Gates green. Commit `feat(kajian): event detail page`.

**Exit:** opening a kajian (from `/peta` or a link) shows full detail with working back nav.

---

## Self-review (each PR)
Spec coverage; no hardcoded user-facing strings (all `m.*`); no module-singleton stores (context-DI); no hand-rolled fetch outside `core/api` (except the tile proxy, which is its own BFF route — note it); `STADIA_API_KEY` never client-side; no arbitrary token values; cursor (not offset) pagination; Leaflet imported client-only.

## Out of scope (Phase C)
`/masjid`, `/ustadz`, `/tema` detail pages (D/E/F) · search (F) · offline/realtime · clustering beyond basic pins.
