---
alwaysApply: true
description: >
  Superseded for Qarib Web v1 by ADR 0009 and ADR 0012. Qarib Web v1 is
  public read-only with no account/session surface.
---

# Auth and Session Rule

Status: **inactive for Qarib Web v1**. Historical boilerplate guidance below is
superseded by ADR 0009 (`public-no-auth-web-v1`) and ADR 0012
(`read-through-bff`).

Qarib Web v1 must not implement login cookies, server sessions, Bearer
injection, protected layout guards, favorites/follows, logout, CSRF tied to
account mutation, or mutating BFF routes. The only BFF surface in v1 is the
same-origin public read-through GET proxy to the qarib-api runtime.

Future account work requires a new accepted ADR before this rule can become
active again. That ADR must define session storage, cookie attributes, CSRF,
refresh semantics, guarded route boundaries, and account-specific BFF behavior.

## Source of truth

- Current v1 ADR: `docs/decisions/0009-public-no-auth-web-v1.md`
- Current v1 BFF ADR: `docs/decisions/0012-read-through-bff.md`
- Superseded historical ADR: `docs/decisions/0003-auth-ssr-cookie.md`

## DO

- **DO** keep Qarib Web v1 public and read-only unless a new account ADR supersedes ADR 0009.
- **DO** route public GET reads through `/api/upstream/[...path]` and never from the browser directly to the qarib-api runtime.
- **DO** strip browser cookies from outbound public read-through BFF requests.
- **DO** validate query/path inputs before forwarding public BFF reads.
- **DO** document any future account proposal in a new ADR before adding account code.

## DON'T

- **DON'T** add `/login`, `/logout`, account guards, favorites/follows, user sessions, or account mutation flows for current v1.
- **DON'T** add Bearer injection or token refresh to the current public read-through BFF.
- **DON'T** add session resolution to `hooks.server.ts` for current v1.
- **DON'T** protect `/peta`, `/kajian/[id]`, `/tempat/[id]`, `/ustadz/[id]`, `/tema/[id]`, or `/cari` behind account state.

## Future Account ADR Sketch

If product scope changes, draft a new ADR before implementation. It should
answer:

- Which account features ship first, and why web needs them.
- Session lifetime, storage backend, cookie attributes, and rotation strategy.
- CSRF requirements for unsafe methods.
- Guarded routes and public routes.
- Token handling between qarib-web and the qarib-api runtime.
- Migration plan from public read-only v1.

## Quick reference

| Symptom | Likely cause | Fix |
|---|---|---|
| Request to add sign-in or saved items | Future account scope leaking into v1 | Write a new ADR; do not code it in v1 |
| Public page asks for session state | Stale boilerplate pattern | Remove account dependency; keep page public |
| BFF code injects Authorization | Stale account BFF pattern | Keep v1 BFF as public GET read-through |
| Route blocks anonymous visitors | Violates ADR 0009 | Remove guard unless a new ADR supersedes v1 |
