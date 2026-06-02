# 0011 — Map: Leaflet + Styled Raster Tiles

- **Status:** Proposed
- **Date:** 2026-06-03
- **Deciders:** madezin (product owner), lead
- **Tags:** map, dependency, styling

## Context

Qarib is map-first: the core experience is "kajian pins near me," backed by
`qarib-api`'s `/events/nearby` (PostGIS distance/region feed). The qarib-cms
already used **Leaflet** (the pin-tier logic and components can port). The design
mockups show a **warm cream/orange styled** map, not the default OSM look. The
repo is **SSR-first**, but Leaflet is a browser-only library (needs `window`).

## Options considered

### Option A — Leaflet + free OpenStreetMap raster
Pros: free, no key, proven (cms used it), trivial.
Cons: standard blue/green OSM look — does not match the warm Qarib palette.

### Option B — Leaflet + styled raster (Stadia / Stamen)
Pros: same Leaflet base + cms reuse; a free-tier provider whose styles are close
to the warm design; better fidelity now.
Cons: needs a provider **API key** (domain-restricted, client-side) and an account.

### Option C — MapLibre GL + MapTiler vector
Pros: fully custom-styleable to the exact palette; crisp vector at any zoom.
Cons: most setup; key + usage cost at scale; no cms reuse (different lib).

## Decision

**Option B.** Leaflet + a Stadia/Stamen **styled raster** layer, rendered as a
**client-only island** inside SSR pages (mounted in `onMount`, never during SSR).
The tile key is a domain-restricted public key supplied via env. The deciding
factor: closest to the approved warm design at low cost and effort, while
reusing Leaflet patterns and the `pinTierService` from qarib-cms. Styling is a
tile-layer swap, so moving to vector later is cheap if needed.

## Consequences

Easier:
- Design fidelity now; pin-tier logic + map components port from cms.
- The map is an isolated island — the rest of the page stays SSR.

Harder:
- A **Stadia Maps API key** dependency (the product owner provisions it; free tier).
- The client-only boundary must be respected: no Leaflet import in server/SSR paths.

Revisit if:
- Tile cost/limits bite or a custom style is wanted → move to Option C (vector).
- The provider has an outage → fall back to free OSM tiles (Option A) via config.

## Compliance

- Linked rule: `.claude/rules/styling.md` — map chrome (pins, sheet) uses the design tokens.
- Linked rule: `.claude/rules/dependency-policy.md` — Leaflet + the tile provider are
  recorded in `docs/decisions/dependencies.md` with rationale + bundle note (map code
  is route-split, not in the base shell bundle).
- Linked rule: `.claude/rules/architecture.md` — the map is a client-only island/composite
  under a server route; no upward/SSR import violations.

## Notes

`/events/nearby` returns `distance_km` in distance mode and supports a region
mode (`region_id`); the map store must handle geolocation-permission-denied by
falling back to region. Cursor pagination on the feed is composite
(`(distance, id)` / `(date_start, id)`) — see qarib-api `docs/features/events.md`.
