# Architecture Overview

Qarib Web is a **server-first SvelteKit public browse app** for kajian/events.
v1 is no-account, Bahasa-first, read-only, SSR, and backed by a same-origin
read-through BFF. The browser calls Qarib Web; Qarib Web calls the
**qarib-api runtime** through `/api/upstream`.

Topology:

```text
qarib-cms writes content/schema -> qarib-api runtime serves public reads -> qarib-web presents -> native mobile later
```

`qarib-cms` owns authoring, mutations, and schema stewardship. Qarib Web owns
presentation, route-level orchestration, cache/tracing headers, and client-safe
public discovery. Native mobile consumes the same product domain later; it is
not part of web v1.

## Layered Model

```text
src/routes/
  (marketing)/        landing page
  (app)/              public browse routes
  api/upstream/       public GET BFF to qarib-api runtime
  api/tiles/          map tile proxy
      |
      v
src/lib/domains/<name>/
  schema.ts           generated types + Zod at trust boundaries
  service.ts          only domain caller of core/api
  queries.ts          svelte-query keys and bindings
  store.svelte.ts     UI-only state, context-scoped
  components/
      |
      v
src/lib/core/
  api/                endpoint registry, core-fetch, ApiError
  query/              svelte-query setup
  config/             env validation
  logger/             server/client logging facade
  i18n/               Paraglide facade, default id
  location/           user location state helpers
      |
      v
src/lib/generated/    openapi-typescript output from openapi/upstream.yaml
```

## Data Flow

1. Visitor opens a public route such as `/peta`, `/kajian/[id]`,
   `/tempat/[id]`, `/ustadz/[id]`, or `/tema/[id]`.
2. `hooks.server.ts` mints request context, runs i18n, applies security/CSP
   headers, and logs errors. It does not resolve end-user sessions in v1.
3. The route's `+page.server.ts` parses URL/search params, then calls a domain
   service.
4. The domain service calls the typed `core/api` client.
5. `core/api` targets same-origin `/api/upstream`, whose BFF forwards public
   `GET` reads to the qarib-api runtime, strips browser-only headers, propagates
   `x-request-id`, and applies cache headers.
6. Server-rendered HTML is returned in Bahasa. Hydration reuses the same data;
   svelte-query owns subsequent server-state caching.

The browser never receives qarib-api runtime URLs, private env, tokens, or
server credentials. It also never calls the qarib-api runtime directly.

## Trust Boundaries

| Boundary | Crosses | Allowed in v1 |
|---|---|---|
| Browser -> SvelteKit route | HTTP | Public routes, public cookies/env only, no end-user auth state |
| Browser -> `/api/upstream` | HTTP GET | Same-origin public read requests |
| SvelteKit BFF -> qarib-api runtime | HTTP GET | Public read calls, request id, curated headers, cache policy |
| SvelteKit -> tile provider | HTTP GET | Tile proxy requests with server-held provider config |
| Server-only modules | `*.server.ts`, `src/lib/server/**` | Private env, proxy helpers, response header control |
| Client modules | everywhere else | `PUBLIC_*` env and hydrated page data only |

## Route Model

- `src/routes/(marketing)/` owns `/`, the public landing page.
- `src/routes/(app)/` owns public browse pages gated behind a location
  completion marker (`qarib_location_complete=v1` cookie). Without the marker,
  requests receive a 303 redirect to `/lokasi?returnTo=...`. The gate is a
  privacy-preserving completion check — it never receives or stores coordinates
  or region identifiers. There is no v1 login flow and no end-user session gate.
- `src/routes/lokasi/` is an ungated onboarding route outside `(app)`.
- `src/routes/api/upstream/[...path]/+server.ts` owns the qarib-api runtime
  read-through BFF.
- `src/routes/api/tiles/[...tile]/+server.ts` owns map tile proxying.

## State

- **Server state**: data fetched from qarib-api runtime, owned by svelte-query
  via `core/query`.
- **UI state**: filters, selected pins, sheets, owned by context-scoped domain stores.
- **Location preference**: versioned, Zod-validated client-side record in
  `localStorage` (GPS coordinates or manual province/city). Managed by
  `core/location/preference.svelte.ts`. A separate completion marker cookie
  (`qarib_location_complete=v1`) signals schema completion to the server gate
  without exposing coordinates or region identifiers.
- **Locale state**: Bahasa-only v1 (`id`) via Paraglide and root layout data.
- **No v1 session state**: no login, signup, favorites, follows, or per-user
  authorization branch exists in the current architecture.
- **Module-singleton state is forbidden** for anything stateful. Pure constants
  and functions are fine.

## Errors

- All API errors funnel through `ApiError` from `core/api/error.ts`.
- Route loaders convert missing/invalid product data into SvelteKit errors at
  the route boundary.
- `+error.svelte` renders global failures with request context where available.
- `handleError` in hooks logs structured errors through the logger.

## i18n

- All user-facing strings live in `messages/id.json` and flow through
  `$core/i18n`.
- `id` is the only shipped locale in v1. English/Arabic localization is later;
  Arabic may appear as decorative brand/script content only.

## Forbidden Patterns

- Browser-direct calls to the qarib-api runtime.
- Login, session guard, Bearer injection, refresh-token, or CSRF flows in v1
  public browse work.
- Mutating `/api/upstream` routes; qarib-web is public read-only.
- Module-singleton stateful stores.
- Hand-rolled `fetch` outside `core/api` for product reads and outside server
  proxy helpers for BFF/tile routing.
- Vanilla `Map`/`Set` with `updateCounter` reactivity hacks. Use `SvelteMap` /
  `SvelteSet`.
- Backend-shape leakage in URL builders.
- Inline user-facing strings.
