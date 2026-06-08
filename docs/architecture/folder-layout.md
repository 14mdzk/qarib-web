# Folder Layout

This file is the canonical map. If a layout change is proposed, update this
file in the same PR.

```text
qarib-web/
├── CLAUDE.md                       project entry for agents
├── README.md                       contributor quickstart
├── docs/                           charter, roadmap, architecture, ADRs, guides, plans
├── .claude/
│   ├── CLAUDE.md                   wiki pointer
│   ├── agents/                     mirrored personas + specialists, when present
│   ├── rules/                      always-applied behavioral rules
│   └── settings.json
├── messages/
│   └── id.json                     Bahasa Indonesia Paraglide catalog
├── openapi/
│   └── upstream.yaml               qarib-api runtime OpenAPI snapshot
├── src/
│   ├── app.d.ts                    App.Locals, App.PageData, App.Error
│   ├── app.html                    shell HTML
│   ├── hooks.server.ts             request id, i18n, security headers, handleError
│   ├── hooks.client.ts             client error reporter
│   ├── lib/
│   │   ├── core/                   framework primitives, no domain logic
│   │   │   ├── api/                endpoint registry, core-fetch, error, envelope
│   │   │   ├── config/             zod-validated env loader
│   │   │   ├── i18n/               Paraglide facade
│   │   │   ├── location/           location preference helpers
│   │   │   ├── logger/             pino + client wrapper
│   │   │   ├── query/              svelte-query setup + defineQuery/Mutation
│   │   │   ├── realtime/           historical/reusable client code; not a v1 product flow
│   │   │   └── result/             Result<T,E>, ApiError
│   │   ├── shared/                 cross-domain UI + utils
│   │   ├── domains/                public browse slices mirroring qarib-api modules
│   │   │   ├── events/             kajian/event occurrence browse
│   │   │   ├── places/             venue browse/detail
│   │   │   ├── asatidz/            ustadz browse/detail
│   │   │   └── subject/            tema browse/detail
│   │   ├── server/                 server-only modules, never bundled to client
│   │   │   ├── bff-proxy.ts        public GET proxy to qarib-api runtime
│   │   │   └── tile-proxy.ts       map tile proxy
│   │   └── generated/              openapi-typescript output, do not edit
│   └── routes/
│       ├── +layout.server.ts       root data, locale/request context
│       ├── +layout.svelte          app bootstrap
│       ├── +error.svelte           global error boundary
│       ├── (marketing)/            landing route group
│       │   ├── +layout.svelte
│       │   └── +page.svelte
│       ├── (app)/                  public, unguarded browse routes
│       │   ├── +layout.svelte      browse app shell
│       │   ├── +error.svelte
│       │   ├── peta/
│       │   ├── kajian/[id]/
│       │   ├── tempat/[id]/
│       │   ├── ustadz/[id]/
│       │   └── tema/[id]/
│       └── api/
│           ├── upstream/[...path]/ public read-through BFF for qarib-api runtime
│           └── tiles/[...tile]/    map tile proxy
├── tests/                          Playwright specs, when present
├── eslint.config.js
├── prettier config
├── lefthook.yml
├── playwright.config.ts
├── vitest.config.ts
├── svelte.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

## Aliases

Configured in `svelte.config.js`:

| Alias | Path |
|---|---|
| `$lib` | `src/lib` |
| `$core` | `src/lib/core` |
| `$shared` | `src/lib/shared` |
| `$domains` | `src/lib/domains` |
| `$server` | `src/lib/server` |
| `$generated` | `src/lib/generated` |
| `$routes` | `src/routes` |
| `$messages` | `messages` |

`$server` and `$generated` are import-allowlisted. See
[`layer-rules.md`](layer-rules.md).

## File Naming

- Svelte components: `kebab-case.svelte`
- TS modules: `kebab-case.ts`
- Files containing runes: must end in `.svelte.ts` or live inside a `.svelte`
  component.
- Server-only TS: must end in `.server.ts` or live under `src/lib/server/**`.
- Tests: co-located `*.test.ts` for units (Vitest); `e2e/**.e2e.ts` for
  Playwright. The `.e2e.ts` extension keeps Bun's built-in runner from grabbing
  Playwright specs.

## Current Route Rules

- Public browse pages go under `src/routes/(app)/`.
- Landing/marketing pages go under `src/routes/(marketing)/`.
- Same-origin BFF endpoints go under `src/routes/api/`.
- Do not add a v1 `(auth)` route group or `(app)` session guard without a new
  ADR that supersedes ADR 0009.

## Forbidden

- `src/lib/utils.ts` mega-file. Split per concern under `src/lib/shared/utils/`.
- Components living outside `shared/primitives`, `shared/composites`, or a
  domain folder.
- Stores under `src/lib/stores/`. Stores live with their domain.
- Browser-direct qarib-api runtime calls.
- "miscellaneous" or "common" folders. Name what is in it.
