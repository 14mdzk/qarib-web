# Dependency Rationale

One-line rationale per non-trivial dependency added to `package.json`. New entries appended chronologically. Required by `.claude/rules/dependency-policy.md` and `.claude/rules/definition-of-done.md`.

## Runtime dependencies

| Package | Version | Rationale |
|---|---|---|
| `clsx` | `^2.1.1` | Idiomatic conditional-className builder. ~239 B, ESM-only, single-purpose, MIT. Used by `cn()` in `src/lib/shared/utils/cn.ts`. |
| `tailwind-merge` | `^3.5.0` | Resolves conflicting Tailwind utility classes (later wins). ~5 KB, ESM-only, single-purpose, MIT. Used by `cn()` to make `clsx` output safe under Tailwind. |

## Font dependencies

| Package | Version | Rationale | License |
|---|---|---|---|
| `@fontsource-variable/plus-jakarta-sans` | `^5.2.8` | Self-hosted variable-weight Plus Jakarta Sans (body font). Eliminates external CDN fetch; SSR-safe via CSS `@import`. OFL-1.1 (permissive web-font licence, no copyleft). ~92 KB woff2 subset. | OFL-1.1 |
| `@fontsource-variable/fraunces` | `^5.2.9` | Self-hosted variable-weight + italic-axis Fraunces (display/serif). `wght-italic.css` provides the italic variant required for emphasis headings. OFL-1.1. | OFL-1.1 |
| `@fontsource/noto-naskh-arabic` | `^5.2.11` | Self-hosted Noto Naskh Arabic static weights (Arabic text support). No variable-axis package exists; static is correct for this family. OFL-1.1. | OFL-1.1 |

**OFL-1.1 note:** OFL-1.1 (SIL Open Font Licence) is not in the explicit licence allowlist (MIT, Apache-2.0, BSD, ISC). It is a permissive web-font-specific licence with no copyleft, no source-disclosure requirement, and is the standard licence for Google Fonts self-hosting via @fontsource. Legal review not required (same determination as Google Fonts usage), but recorded here per dependency-policy.md.

## Dev dependencies

| Package | Version | Rationale |
|---|---|---|
| `@vitest/coverage-v8` | `^4.1.5` | V8-based coverage provider for Vitest. Peer of `vitest`; required to run `vitest --coverage`. Zero runtime surface, test-only, MIT. |

## Conventions

- Runtime deps that ship in the client bundle live under `dependencies` in `package.json`. Server-only deps (e.g. `pino`) likewise live under `dependencies` because the Node adapter bundles them.
- Direct deps pin a minor (`^1.2.3`); transitive pins live in `bun.lock`.
- A dep that fails any of the `dependency-policy.md` "Vetting checklist" items 1, 2, or 3 must not be added. Failing 4–6 is a discussion captured in this file.
