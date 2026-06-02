# 0009 — Public, No-Account Web (v1): Strip the Auth Surface

- **Status:** Proposed
- **Date:** 2026-06-03
- **Deciders:** madezin (product owner), lead
- **Tags:** auth, scope, bff

## Context

Qarib-web's product promise, on the landing itself, is *"gratis, tanpa akun,
tanpa unduh"* — free, no account, open in a browser. v1 has **no user-specific
features** (no favorites, no "follow an ustadz", no submissions).

Two facts make accounts unnecessary for v1:

1. **qarib-api's browse endpoints are public.** There is no global `security`
   requirement; only `/auth/*` and `/users*` declare `bearerAuth`. Every
   discovery endpoint (`/events`, `/events/nearby`, `/places`, `/asatidzs`,
   `/subjects`, …) needs no token.
2. **The surfaceit boilerplate ships a full auth surface** — `(auth)/login`,
   `(auth)/logout`, a session-guarded `(app)` layout, cookie-session +
   transparent refresh, CSRF, and a Bearer-injecting BFF (ADR 0003, 0008).
   None of it is reachable by a v1 user flow.

Carrying that surface dormant means dead code in the user path, a session guard
that can flash/redirect, CSRF ceremony protecting nothing, and a BFF doing
token work for reads that need none.

## Options considered

### Option A — Keep the auth surface dormant
Pros:
- Ready the day we add accounts.

Cons:
- Dead, untested-in-practice flows in the user path; the session guard adds SSR
  complexity and redirect edge cases for zero benefit.
- A visible `/login` route that does nothing for the product is confusing.
- Ongoing maintenance + review burden on a security-sensitive surface we do not use.

### Option B — Strip the auth surface for v1
Remove `(auth)/login`, `(auth)/logout`, the `(app)` session guard, cookie-session
+ refresh, and auth-CSRF. The BFF becomes a **public read-through** proxy (ADR 0012).

Pros:
- Smaller, honest surface that matches the promise. No dead flows, no guard flashes.
- The BFF collapses to forward-public-GET; no token handling anywhere.
- Restoring accounts later is a known boilerplate pattern recoverable from git
  history + ADR 0003/0008.

Cons:
- Re-adding accounts is real work later (mitigated: the pattern is documented and in history).

### Option C — Gate auth behind a feature flag
Pros: one toggle to "turn auth back on."
Cons: flag plumbing + branching for a binary product decision; the dead code stays, now behind a flag.

## Decision

**Option B.** Strip the auth surface for v1; the BFF becomes a public
read-through proxy (ADR 0012). The deciding factor: the product is explicitly
accountless, the data is public, and an unused auth surface is pure risk and
confusion for zero v1 value.

## Consequences

Easier:
- Far smaller surface; no `ssr=false`/guard/redirect edge cases; no CSRF ceremony.
- The BFF is trivial to reason about — it forwards public reads, nothing else.

Harder:
- Adding accounts in v1.x means restoring the auth pattern (login/session/refresh/
  Bearer-BFF) from the boilerplate + history, under a new ADR superseding this one.

Revisit if:
- A feature needs identity — favorites, "follow", attendance, submissions. At
  that point restore the auth surface and the Bearer-injecting BFF, and write the
  superseding ADR.

## Compliance

- Linked rule: `.claude/rules/auth-and-session.md` — its mechanism is **not used**
  in v1. The rule remains as the pattern to restore; this ADR scopes it out for now.
- Linked rule: `.claude/rules/security.md` — CSP / header hygiene / request-id stay;
  only the auth/token + CSRF parts are out of scope for public reads.
- Linked ADR: `docs/decisions/0003-auth-ssr-cookie.md` (the model being narrowed),
  `docs/decisions/0008-auth-direct-upstream-exception.md` (its carve-out, now moot
  in v1), `docs/decisions/0012-read-through-bff.md` (what the BFF does instead).

## Notes

This is a fork-time scope decision: this repo is the Qarib product, not the
reusable boilerplate (see charter). The boilerplate's auth surface was built for
backends that require it; Qarib's read surface does not.
