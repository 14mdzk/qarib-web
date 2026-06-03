# 0013 — Map Tiles via BFF Proxy (Key Stays Server-Side)

- **Status:** Proposed
- **Date:** 2026-06-03
- **Deciders:** madezin (product owner), lead
- **Tags:** map, security, bff

## Context

The `/peta` map (Phase C) renders Stadia Maps raster tiles via Leaflet. Stadia
authenticates tile requests with an API key. The key was provisioned as
`STADIA_API_KEY` (no `PUBLIC_` prefix → private intent). `.claude/rules/security.md`
is explicit: **"DON'T put secrets in `PUBLIC_*` env vars."** SvelteKit only exposes
`PUBLIC_*` to the browser, so a private `STADIA_API_KEY` is unreadable in client
code (Leaflet runs client-side).

## Options considered

### Option A — `PUBLIC_STADIA_API_KEY`, tiles fetched client-side
Leaflet hits `tiles.stadiamaps.com` directly with the key, restricted by a Stadia
domain allowlist.
Pros: zero proxy hop; tiles served from Stadia's CDN; the standard map-token pattern.
Cons: the key ships in the client bundle. Even domain-restricted, it contradicts
`security.md`'s no-secrets-in-`PUBLIC_` rule and the provisioned private name.

### Option B — BFF tile proxy, key server-side (chosen)
A `GET /api/tiles/{z}/{x}/{y}` route injects `STADIA_API_KEY` server-side and
forwards to Stadia, with a long `Cache-Control`.
Pros: the key never reaches the browser (honors `security.md` + the private name);
one server-side chokepoint; tiles are highly cacheable.
Cons: every tile request hops our Node server — added latency + load vs a direct CDN
fetch.

### Option C — self-host a tile server
Pros: full control, no per-tile key exposure.
Cons: massive operational overhead (tile storage/rendering) — absurd for an MVP.

## Decision

**Option B.** Keep `STADIA_API_KEY` server-only and proxy tiles through the BFF at
`/api/tiles/...`, with aggressive `Cache-Control`. Deciding factor: it keeps the key
off the client (security.md) and matches the provisioned private var, at an
acceptable MVP cost.

## Consequences

Easier:
- The key is confined to the server; no client-bundle exposure to audit.
- One place owns tile caching + the upstream URL.

Harder:
- Each tile request traverses our Node process — mitigated by `Cache-Control`
  (tiles are immutable per z/x/y) and, later, a CDN in front of `/api/tiles`.

Revisit if:
- Tile volume makes the proxy hop a bottleneck → put a CDN/edge cache in front of
  `/api/tiles`, or move to Option A (domain-restricted public token) if we accept a
  public map token as non-secret.

## Compliance

- `.claude/rules/security.md` — key server-side only; the proxy strips client headers.
- `.claude/rules/api-contract.md` — the tile route is a **documented non-`api()` BFF
  route** (binary tiles, not the JSON envelope); the `api()` registry rule still holds
  for all data calls.
- `.claude/rules/dependency-policy.md` — Leaflet added for the map (ADR 0011); recorded
  in `docs/decisions/dependencies.md`.
- Linked: ADR 0011 (Leaflet + styled raster), ADR 0012 (read-through BFF — same proxy
  discipline, here for tiles).

## Notes

Pick a **warm** Stadia style (e.g. `alidade_smooth` or `stamen_toner_lite`) to match
the landing palette. The free tier requires attribution — render the Stadia/OSM
attribution control on the map.
