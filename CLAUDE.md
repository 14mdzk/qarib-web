# Qarib Web

SvelteKit public web launch surface for discovering kajian/events, places,
ustadz, and topics. v1 is no-account, Bahasa-first, public read-only, SSR, and
backed by a same-origin read-through BFF.

Current topology:

```text
qarib-cms writes content/schema -> qarib-api runtime serves public reads -> qarib-web presents -> native mobile later
```

The browser must not call the qarib-api runtime directly. Route loads and client
navigation use Qarib Web's typed API layer, which targets `/api/upstream` for
public GET reads.

## Source of truth

| What | Where |
|---|---|
| Project intent and scope | `docs/charter.md` |
| Phased plan | `docs/roadmap.md` |
| Architecture, folder layout, layer rules | `docs/architecture/` |
| Architecture Decision Records | `docs/decisions/` |
| Best practices, findings, anti-patterns | Obsidian wiki — see `.claude/CLAUDE.md` for the access protocol |
| Operational guides (add domain, add route…) | `docs/guides/` |
| Always-applied behavioral rules | `.claude/rules/` |
| Persona team and specialist agents | root roster at `/Users/maulanazain/Documents/Projects/qarib/.claude/agents/` |

## Reading order for any agent

1. `docs/charter.md` — Qarib product scope, topology, and non-goals.
2. `docs/roadmap.md` — shipped and in-flight vertical slices.
3. `docs/architecture/overview.md` — current public web architecture.
4. `docs/decisions/0009-public-no-auth-web-v1.md` and
   `docs/decisions/0012-read-through-bff.md` — current auth/BFF truth.
5. `.claude/rules/*.md` — rules to check before constrained work. If a rule
   conflicts with ADR 0009/0012, treat the ADR as the current Qarib v1 scope and
   flag the rule for reconciliation instead of implementing stale auth/session
   behavior.
6. Team roster: use the root roster as the actual available team source:
   `/Users/maulanazain/Documents/Projects/qarib/.claude/agents/`. If this
   worktree also has `.claude/agents/`, ignore stale local personas and prefer
   the root roster.
7. Obsidian wiki — only when project context is missing and per
   `.claude/CLAUDE.md` (start with `wiki/hot.md`).

Never act before reading the rules that govern your task. The rules override default behavior; user instructions override the rules.

## Anti-drift contract

Every PR must:
- pass `bun run check && bun run lint && bun run test && bun run build` (Phase 1 scripts). Note: `bun run test` (Vitest) is not the same as `bun test` (Bun's built-in runner — not used here).
- cite the rule(s) it satisfies if it touches a constrained surface (auth, state, api, styling, i18n).
- include or update the relevant doc page when behavior changes.
- be the product of a **dispatched agent** (persona or specialist) — see `.claude/rules/agent-dispatch.md`. The main thread orchestrates and reviews; it does not implement in place when delegation is the right call.
- have **every task in scope marked complete** before the PR is opened. No follow-up PR exists whose only purpose is to flip a task to `completed`.

For current Qarib Web v1, do not add login, session guards, favorites/follows,
Bearer injection, mutating BFF routes, or browser-direct qarib-api calls unless
a new accepted ADR supersedes ADR 0009 and ADR 0012. That old boilerplate path
is historical, not latent product strategy.

If you cannot find a rule that covers your situation, do not invent one in code. Open a discussion (or write an ADR draft) and pause.

## Specialist agents

Use the root specialist roster as the source of truth:
`/Users/maulanazain/Documents/Projects/qarib/.claude/agents/`. It contains the
active specialist list for this workspace; do not hard-code a stale local
roster.

## License

TBD. Treat as private until decided.
