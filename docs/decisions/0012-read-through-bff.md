# 0012 — Read-Through BFF for Public Upstream Reads

- **Status:** Accepted
- **Date:** 2026-06-03
- **Deciders:** madezin (product owner), lead
- **Tags:** api, bff, security

## Context

v1 has no user auth (ADR 0009) and `qarib-api`'s browse endpoints are public.
But we still want (a) SSR, (b) to **not** expose the upstream URL/topology to the
browser, (c) one chokepoint for tracing + caching, and (d) the `{ success, data }`
envelope unwrapped exactly once. The boilerplate already has a BFF at
`src/routes/api/upstream/[...path]/+server.ts` that was built to inject a Bearer
from the session — which v1 no longer has.

## Options considered

### Option A — Browser calls `qarib-api` directly (CORS)
Pros: no proxy hop.
Cons: leaks the upstream URL + topology to the client; needs CORS on the API; no
same-origin place to cache, trace, or unwrap envelopes; couples the client to the
upstream shape.

### Option B — Keep a thin same-origin read-through BFF
Forward public `GET`s to `qarib-api`; strip client `cookie`/`host`/`origin`; add
`x-request-id` (propagate up + back); set conservative `Cache-Control` per
resource; unwrap `{ success, data }` once. No Bearer.

Pros: upstream stays hidden; one chokepoint for cache + tracing + envelope; SSR
loaders and the browser both hit a stable same-origin path.
Cons: a proxy hop per read (negligible, same process/origin).

### Option C — Full CDN/edge cache layer now
Pros: best read performance at scale.
Cons: premature; infra we do not need for an MVP; tune later.

## Decision

**Option B.** Simplify the existing BFF to a **public read-through** proxy:
forward `GET` to `qarib-api`, strip `cookie`/`host`/`origin`, add and propagate
`x-request-id`, unwrap the envelope once in `core-fetch`, and set conservative
per-resource `Cache-Control`. **No `Authorization`** (reads are public). Caching
is a **principle now** — concrete TTLs (e.g. nearby feed short, place/ustadz/subject
longer) are tuned when the Events slice lands (Phase C), recorded then.

The deciding factor: keep SSR + topology hiding + a single tracing/caching point
**without** any auth complexity.

## Consequences

Easier:
- The browser never learns the upstream URL; one place owns cache + request-id + envelope.
- The BFF becomes small and obviously correct (forward-public-GET).

Harder:
- A proxy hop per read (negligible same-origin) and TTL tuning to do in Phase C.

Revisit if:
- Accounts return (ADR 0009 revisit) → the BFF regains Bearer injection from the session.
- Read volume needs a real edge/CDN cache (Option C).

## Compliance

- Linked rule: `.claude/rules/api-contract.md` — envelope unwrapped once at the
  BFF/`core-fetch` boundary; all upstream calls still go through `core/api`.
- Linked rule: `.claude/rules/security.md` — strip `cookie`/`host`/`origin`, keep
  CSP + security headers; no secrets needed (public reads).
- Linked rule: `.claude/rules/observability.md` — `x-request-id` minted in
  `hooks.server.ts`, forwarded to upstream, echoed back.
- Linked ADR: `docs/decisions/0003-auth-ssr-cookie.md` (the BFF's origin), `0009` (why no Bearer).

## Notes

`POST`/mutating proxying and CSRF are out of scope for v1 (no write paths). If a
write surface appears, this ADR is revisited alongside ADR 0009.
