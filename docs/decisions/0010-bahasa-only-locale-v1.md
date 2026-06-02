# 0010 — Bahasa Indonesia as the Sole v1 Locale

- **Status:** Proposed
- **Date:** 2026-06-03
- **Deciders:** madezin (product owner), lead
- **Tags:** i18n, scope

## Context

Qarib's audience is Indonesian and **all** of the drafted design copy is Bahasa
Indonesia. The surfaceit boilerplate ships an English-only catalog but with the
full i18n layer (Paraglide) already wired (ADR 0005, 0007): every string flows
through `$core/i18n`, locale resolves from a cookie, adding a locale is a JSON drop.

## Options considered

### Option A — Bahasa only (`id`)
Pros:
- Matches the audience and the existing copy exactly; least work.
- The i18n layer stays, so a future locale is a JSON file + translation — no refactor.

Cons:
- None material for v1 (non-Indonesian reach is not a v1 goal).

### Option B — Bilingual `id` + `en`
Pros: early non-Indonesian reach; exercises the switcher.
Cons: doubles copy/translation per screen for an audience that is Indonesian; switcher UI to build/test.

### Option C — Multilingual `id` + `en` + `ar`
Pros: widest reach.
Cons: triple translation overhead; Arabic adds RTL concerns; clearly premature for v1.

## Decision

**Option A.** Ship a single `id` catalog (`messages/id.json`), default locale
`id`, **no switcher**. Keep the Paraglide layer and the facade intact so every
user-facing string still routes through i18n. Arabic remains a **decorative
accent** in the design (e.g. `قريب`), not a translation locale.

The deciding factor: the audience and copy are Bahasa; the i18n layer means
"single locale now" costs nothing later.

## Consequences

Easier:
- One catalog to maintain; copy matches the design verbatim.
- Adding `en`/`ar` later = drop `messages/<locale>.json` + translate + enable a switcher.

Harder:
- Nothing material — the layer is retained, so this is reversible by addition, not rewrite.

Revisit if:
- Non-Indonesian reach becomes a goal, or a full Arabic (RTL) experience is wanted.

## Compliance

- Linked rule: `.claude/rules/i18n.md` — every user-facing string still flows
  through `$core/i18n`; only the default locale (now `id`) and the shipped catalog change.
- Linked ADR: `docs/decisions/0005-i18n-paraglide.md`, `docs/decisions/0007-i18n-facade-and-key-shape.md`.

## Notes

The boilerplate's "ship `en` only on day one" guidance becomes "ship `id` only"
for this fork. Keys stay English (`events_nearby_empty`, …) per ADR 0007; values are Bahasa.
