---
alwaysApply: true
description: >
  Security baseline for Qarib Web v1: public read-only controls, strict
  headers, input validation, cache boundaries, and no credential handling.
---

# Security Rule

## DO

- **DO** apply security headers in `hooks.server.ts`:
  - `Content-Security-Policy` (strict; `script-src 'self'`; no `unsafe-inline` outside dev)
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (in production)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-Content-Type-Options: nosniff`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()` (open up only what features need)
- **DO** validate untrusted input at trust boundaries with Zod: route params, query params, public BFF request inputs, and any future form actions.
- **DO** strip `cookie`, `host`, and `origin` from outbound public read-through BFF requests.
- **DO** keep public BFF routes GET-only for current v1 and return cache headers intentionally (`public`, `private`, or `no-store` by data class).
- **DO** prevent credential handling in current v1: no account cookies, no token storage, no token forwarding, no auth endpoint proxying.
- **DO** keep secrets in `.env` (gitignored). Validate them with a Zod schema at startup; fail fast on missing.
- **DO** document future account controls in a new ADR before adding server-side sessions, CSRF checks, auth rate limits, or unsafe methods.

## DON'T

- **DON'T** put secrets in `PUBLIC_*` env vars. `PUBLIC_*` is shipped to the browser. Only ship what is meant to be public.
- **DON'T** log tokens, session ids, or PII. Redact at the logger.
- **DON'T** echo unvalidated user input into error messages, redirects, or HTML.
- **DON'T** disable CSP "to make a third-party widget work." Whitelist explicitly or remove the widget.
- **DON'T** trust `X-Forwarded-For` without a known reverse-proxy chain. Validate before using for rate-limit / audit.
- **DON'T** add account cookies, CSRF cookies, server-side access/refresh tokens, or auth proxy routes to current v1.
- **DON'T** introduce a third-party script via `<script src="...">` without a Subresource Integrity (`integrity`) attribute and a CSP allowance.

## Bundle hygiene

- No `console.log` of session, user, or environment objects in production builds. Strip via build flag.
- Tree-shake aggressively; check `bun run build --analyze` (or rollup-plugin-visualizer) for unintended deps in the client bundle.
- Server-only modules (`*.server.ts`, `src/lib/server/**`) must not be imported from `*.svelte` outside server contexts. SvelteKit enforces this; reviewers should still notice.

## Dependencies

- See `dependency-policy.md`. Run `bun audit` (or equivalent) in CI; fail on `high` and `critical`.
- Pin direct deps; let lockfile pin transitive.

## Quick reference

| Surface | Threat | Control |
|---|---|---|
| Public BFF read | Header injection | Whitelist headers, strip cookie/host/origin |
| Public BFF read | Overbroad caching | Explicit cache policy by data class |
| Query/search params | Untrusted input | Zod parse, reject or normalize on failure |
| Future account ADR | Credential stuffing / CSRF / token leak | Define rate limits, CSRF, sessions, and token boundaries before coding |
| Logger | PII / token in logs | Redact at sink, never log session objects |
| Static asset | Tampered CDN script | SRI + CSP allowlist |
