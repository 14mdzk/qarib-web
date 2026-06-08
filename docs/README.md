# Qarib Web — Documentation

This directory is the Qarib Web archive. Everything future contributors need to
understand product scope, architecture, decisions, patterns, and rationale lives
here.

## Map

```
docs/
├── README.md                  ← you are here
├── charter.md                 ← project intent, scope, non-goals, success criteria
├── roadmap.md                 ← phased delivery plan
├── architecture/              ← static structural docs
│   ├── overview.md
│   ├── folder-layout.md
│   └── layer-rules.md
├── decisions/                 ← Architecture Decision Records (ADRs)
│   ├── template.md
│   ├── 0001-svelte5-context-di.md
│   ├── 0002-component-strategy.md
│   ├── 0003-auth-ssr-cookie.md
│   ├── 0004-openapi-codegen.md
│   ├── 0005-i18n-paraglide.md
│   ├── 0009-public-no-auth-web-v1.md
│   └── 0012-read-through-bff.md
└── guides/                    ← how-to / playbooks
    ├── add-a-domain.md
    ├── add-a-route.md
    └── run-tests.md
```

> **Living best-practices, findings, and anti-patterns are not stored under `docs/`.**
> They live in the personal Obsidian wiki at `~/Codex-obsidian/wiki/` as concept pages. The access protocol is documented in `.claude/CLAUDE.md` (read `wiki/hot.md` first, then `wiki/index.md`, then drill into specific concepts). This keeps reusable knowledge compounding across projects rather than locked inside one repo's `docs/`.

## Conventions

- **Architecture docs are stable.** They describe the system as it *should be*. Update them when the rules change, not when an experiment runs.
- **ADRs preserve history.** Prefer a new superseding ADR for new decisions.
  When product reality already superseded an old ADR, mark its status clearly
  and keep the original context intact.
- **Wiki pages are alive.** Update freely as you learn. Date your additions. If a wiki page contradicts a rule or an ADR, fix the wiki — those win.
- **Guides are recipes.** Step-by-step. They reference the rules, not duplicate them.

## Where to put new knowledge

| You learned… | Write it in… |
|---|---|
| A rule the team must follow in **this** repo | `.claude/rules/<topic>.md` |
| Why a decision was made in **this** repo | `docs/decisions/NNNN-<slug>.md` (new ADR) |
| A reusable concept, pattern, or anti-pattern that applies beyond this repo | a concept page in the Obsidian wiki under the relevant `domain` (e.g. `frontend`) |
| A repo-specific how-to a teammate will run | `docs/guides/<task>.md` |
| Structural change to **this** repo | `docs/architecture/*` |

Heuristic: if the lesson would still be useful in Qarib's sibling repos, a
future product, or a teammate's unrelated project, it belongs in the Obsidian
wiki, not in `docs/`. If it only makes sense inside this repo's filesystem, it
belongs in `docs/`.

When in doubt, file it as a concept page first — promote to a rule or ADR if it codifies a constraint here.
