# Qarib Web

Qarib Web is the SvelteKit public launch surface for discovering kajian/events,
places, ustadz, and topics. v1 is **no-account**, **Bahasa-first**,
**public read-only**, and server-rendered. The browser talks to Qarib Web only;
Qarib Web reads from the **qarib-api runtime** through the same-origin
`/api/upstream` BFF.

Topology:

```text
qarib-cms writes content/schema -> qarib-api runtime serves public reads -> qarib-web presents -> native mobile later
```

`qarib-cms` owns authoring and write/schema workflows. `qarib-api` owns the
read contract. `qarib-web` owns presentation, browse UX, SSR, cache/tracing, and
client-safe public discovery flows. Native mobile is intentionally later, not a
v1 surface.

## Quickstart

Requires [Bun](https://bun.sh) ≥ 1.1.

```sh
bun install            # install deps + run prepare (svelte-kit sync, paraglide compile, lefthook)
bun run dev            # dev server on http://localhost:5173
bun run check          # typecheck (svelte-check) + paraglide compile
bun run lint           # prettier --check + eslint
bun run test           # Vitest (unit) — see docs/guides/run-tests.md
bun run test:e2e       # Playwright (e2e) — auto-builds and previews on :4173
bun run build          # production build via @sveltejs/adapter-node
```

> **`bun run test` is Vitest.** It is **not** the same as `bun test` (Bun's
> built-in runner, which we do not use). See
> [`docs/guides/run-tests.md`](docs/guides/run-tests.md) for the runner
> separation rule.

## Layout

The canonical map of the repo lives in
[`docs/architecture/folder-layout.md`](docs/architecture/folder-layout.md).
The layer model — what may import what — lives in
[`docs/architecture/layer-rules.md`](docs/architecture/layer-rules.md).

Aliases (`$core`, `$shared`, `$domains`, `$server`, `$generated`, `$routes`,
`$messages`) are wired in `svelte.config.js`. Use them; never reach into a
sibling domain by relative path.

Current public routes live under `src/routes/(app)/` and are unguarded in v1:
`/peta`, `/kajian/[id]`, `/tempat/[id]`, `/ustadz/[id]`, and `/tema/[id]`.
The landing page lives under `src/routes/(marketing)/`. BFF endpoints live under
`src/routes/api/`, including `/api/upstream` for qarib-api public GET reads.

## How to read the docs

Read in this order. Each layer answers a different question.

1. **[`docs/charter.md`](docs/charter.md)** — what we are building, why, and
   what we are explicitly **not** building.
2. **[`docs/roadmap.md`](docs/roadmap.md)** — phased delivery plan. Maps every
   feature to a phase.
3. **[`docs/architecture/overview.md`](docs/architecture/overview.md)** — the
   shape of the system: layers, trust boundaries, data flow, error model.
4. **[`docs/decisions/`](docs/decisions/)** — Architecture Decision Records.
   Read 0009 and 0012 before proposing auth or BFF changes; older auth ADRs are
   historical unless a new account feature explicitly supersedes the v1 model.
5. **[`docs/guides/`](docs/guides/)** — recipes for common tasks (add a
   domain, add a route, run tests).
6. **[`.claude/rules/`](.claude/rules/)** — non-negotiable rules every
   contributor and agent follows. Cite the rule in your PR when you touch a
   constrained surface.

Living patterns and anti-patterns that apply beyond this repo are catalogued
as concept pages in the personal Obsidian wiki — see
[`docs/README.md`](docs/README.md) for the access protocol.

## Status

Phase progress tracks [`docs/roadmap.md`](docs/roadmap.md). The current product
is already past boilerplate foundation: landing, app shell, public BFF reads,
events/map, places, ustadz, and subject browse are landed; search is in flight.

| Phase | Theme                                                                | Status      |
| ----- | -------------------------------------------------------------------- | ----------- |
| 0     | Foundation docs, rules, and initial ADRs                             | done        |
| A     | Qarib fork foundation, no-account app shell, public read-through BFF | done        |
| B     | Landing page                                                         | done        |
| C     | Events/map core browse flow                                          | done        |
| D     | Places detail + upcoming kajian                                      | done        |
| E     | Ustadz profile + active kajian                                       | done        |
| F     | Subjects + search                                                    | in progress |

## Contributing

Read [`CLAUDE.md`](CLAUDE.md) for the agent-dispatch model and the anti-drift
contract every PR must satisfy. The PR template
([`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md))
encodes the [Definition of Done](.claude/rules/definition-of-done.md).

## License

TBD per [`docs/charter.md`](docs/charter.md). Treat as private until decided.
