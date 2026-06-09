# Location Onboarding, Timezone, and Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` or `superpowers:executing-plans`.
> After this documentation PR merges, implement this plan as exactly two
> sequential implementation PRs. Steps use checkbox (`- [ ]`) syntax so each
> implementation PR can mark its own progress.

**Goal:** Require a valid location choice before every app route, use the
browser's timezone for calendar queries, and provide a global location settings
surface without adding accounts or server-side location storage.

**Architecture:** PR1 establishes browser-owned, explicit-offset RFC3339 date
boundaries. PR2 adds a privacy-preserving SSR completion gate, a versioned
client-side location preference, an ungated `/lokasi` onboarding route, region
queries, location-aware map query XOR behavior, and settings available from
every app header.

**Tech Stack:** SvelteKit 2, Svelte 5 runes and context DI, TypeScript, Zod,
TanStack Svelte Query, Paraglide, Vitest, MSW, Playwright.

---

## Locked Product Decisions

These decisions are approved. Implementation must not reopen them inside either
PR.

### Route gate

- `/` remains ungated.
- `/lokasi` remains ungated and lives outside `src/routes/(app)/`.
- Every route under `src/routes/(app)/` requires completed location onboarding.
- The server gate uses only a completion marker. It never receives or stores
  coordinates, province, or city.
- A missing completion marker redirects before an app route renders:
  `303 /lokasi?returnTo=<encoded pathname and search>`.
- A stale marker with missing or invalid client storage is repaired client-side:
  the app layout replaces the current history entry with the equivalent
  `/lokasi?returnTo=...` URL before location-dependent queries are enabled.
- The app layout keeps child content and all location-dependent queries disabled
  until marker and client preference reconcile successfully.

### `/lokasi` route contract

`GET /lokasi?returnTo=<candidate>` supports first-run, marker-recovery,
storage-recovery, and intentional replacement flows.

Safe `returnTo` normalization:

1. Default to `/peta` when absent, malformed, cross-origin, or unsafe.
2. Parse with `new URL(candidate, currentOrigin)`.
3. Require the parsed origin to equal `currentOrigin`.
4. Require the raw candidate to start with `/` but not `//`.
5. Reject credentials, fragments, and `/lokasi` itself.
6. Return only `pathname + search`; never return a full absolute URL.
7. Apply the same shared validator in the server gate, onboarding server action,
   and browser navigation code.

Completion behavior:

- In first-run, storage-recovery, and replacement modes, keep the validated
  choice staged in component state.
- Submit a completion-only server action that sets the marker cookie.
- After action success in those choice-writing modes, replace the single active
  client preference record.
- Marker recovery is the exception: action success restores only the marker and
  leaves the valid active preference record untouched.
- Navigate to validated `returnTo` with replacement semantics so Back does not
  reopen completed onboarding.
- If marker creation fails, keep the user on `/lokasi`, show a localized error,
  retain the staged choice for retry, and preserve any previous active
  preference.
- If client-storage replacement fails after marker creation, stay on `/lokasi`
  and show a localized storage error. The stale-marker reconciliation contract
  prevents entry into location-dependent app behavior.

Replacement and cancellation behavior:

- Intentional replacement requires both a valid completion marker and a valid
  existing preference, normally reached through `Ganti lokasi`.
- Existing preference remains active while a new choice is staged.
- `Batal` is shown only in replacement mode.
- `Batal` does not mutate storage or the completion marker.
- `Batal` returns to validated `returnTo` with `replaceState: true`.
- First-run and both recovery modes have no cancel path. Browser navigation back
  to an app route is caught by the mandatory gate or client reconciliation.

### Recovery-mode state machine

Route mode is derived from server-visible marker state plus validated client
preference after hydration. A query parameter must never grant replacement or
cancel behavior.

| Completion marker | Client preference | Mode | Behavior |
|---|---|---|---|
| missing | missing/invalid | first-run | Require new GPS or manual choice; no `Batal`. |
| missing | valid | marker recovery | Show saved location summary and primary `Lanjutkan dengan lokasi tersimpan`; restore only completion marker; no `Batal`. |
| present | missing/invalid | storage recovery | Keep app queries disabled; replace to `/lokasi`; require new GPS or manual choice; no `Batal`. |
| present | valid | replacement | Prefill saved choice; allow staging replacement and `Batal`. |

Marker recovery preserves user intent and privacy:

- Existing valid preference proves the browser already holds an explicit saved
  choice; recovery does not request GPS again or silently choose a new region.
- Primary recovery action calls the completion-only server action. It sends no
  coordinates, region IDs, names, or preference payload and does not rewrite
  client storage.
- User may choose `Ganti lokasi` instead, stage a new choice, then complete
  normally.
- No `Batal` is offered because returning to an app route without the marker
  would immediately redirect and create a loop.
- Failed marker restoration keeps the saved preference unchanged, remains on
  `/lokasi`, and announces a retryable localized error.

Storage recovery preserves safety:

- Marker alone never authorizes location-dependent queries.
- Missing, malformed, unsupported-version, or invalid client preference keeps
  app children and queries disabled.
- Client navigation uses replacement semantics to avoid a Back loop.
- Visitor must make a new explicit GPS or manual choice before app access
  resumes.

### First-run flow

1. Visitor requests any `(app)` route.
2. Gate redirects to `/lokasi` with original path and query in `returnTo`.
3. Visitor chooses GPS or manual province and city.
4. GPS permission is requested only after the GPS control is activated.
5. GPS success stages a coordinate preference and enables `Simpan & lanjut`.
6. GPS denied or unavailable shows a localized explanation and requires a
   manual city choice. Cirebon is not silently selected.
7. Manual flow requires province first, then city/kabupaten. Changing province
   clears the staged city.
8. Completion creates the marker, replaces the active preference record, and
   replaces navigation to the safe return target.

### Returning-user flow

1. Settings control is present in every app header.
2. Settings opens a mobile bottom sheet below the mobile breakpoint and a
   centered modal at desktop widths.
3. Surface shows the current GPS/manual location summary.
4. `Ganti lokasi` redirects to
   `/lokasi?returnTo=<current pathname and search>`.
5. Replacement onboarding is prefilled from the saved preference.
6. Cancellation preserves the old preference; completion atomically replaces
   it.
7. Settings has no `Hapus` action and no language controls. Bahasa remains the
   only shipped locale under ADR 0010.

### Returning visitor with cleared cookies

1. Visitor has a valid saved preference but no completion marker.
2. Server gate redirects the requested app URL to `/lokasi?returnTo=...`.
3. Onboarding hydrates, detects marker-recovery mode, and shows the saved
   location summary.
4. Visitor confirms `Lanjutkan dengan lokasi tersimpan`; completion action
   restores only the marker.
5. Client preference remains byte-for-byte unchanged.
6. Navigation replaces to the validated return target. `Batal` is never shown.

### Timezone authority

- Browser/client timezone is authoritative for calendar days and date filters.
- Do not configure a static timezone such as `Asia/Jakarta`.
- Do not turn selected calendar boundaries into UTC with `toISOString()`.
- Build `date_from` and `date_to` as explicit-offset RFC3339 values, including
  the correct offset independently at each boundary for DST transitions.
- The frontend may parse explicit-offset instants for display in the browser's
  timezone. It must not manually normalize them to UTC or force a named zone.
- SSR must not derive "today" from the server host timezone. Browser-dependent
  occurrence queries start only after client timezone initialization.
- Manual province/city selection still uses the browser timezone. Region
  `location_tz` is not authoritative and must not override browser time. This is
  a locked product decision.

### Persistence and privacy

Use one versioned client-storage record:

```ts
const LOCATION_PREFERENCE_KEY = 'qarib:location-preference';

type LocationPreferenceV1 =
	| {
			version: 1;
			mode: 'gps';
			savedAt: string;
			coordinates: { lat: number; lng: number };
	  }
	| {
			version: 1;
			mode: 'manual';
			savedAt: string;
			province: { id: string; name: string };
			city: { id: string; name: string };
	  };
```

Rules:

- Parse with Zod at the storage boundary.
- Reject unknown versions, non-finite/out-of-range coordinates, blank IDs, and
  blank names.
- `savedAt` is metadata, not timezone authority.
- Remove the old unversioned `qarib:location:center` record when the new module
  first initializes. Do not silently treat it as completed onboarding.
- Local storage may contain the preference, including GPS coordinates.
- Cookies must never contain GPS coordinates, region IDs, names, or labels.
- Qarib Web must not intentionally persist the location preference or
  coordinates in application logs, analytics payloads, page data, databases,
  server files, or server-side preference stores.
- GPS coordinates necessarily travel in public read query parameters for
  nearby discovery. Request URLs may be processed or retained by browser
  history, service infrastructure, reverse proxies, hosting/CDN logs, tracing,
  caches, and the qarib-api runtime according to their configured policies.
- Do not claim zero retention. Product copy and documentation must say that
  Qarib Web stores the preference only in client local storage and does not
  intentionally add server-side application persistence, while acknowledging
  infrastructure handling of request URLs.
- Before shipping, review BFF, logger, request tracing, error reporting, hosting,
  CDN, and cache behavior for query-string capture. Redact or suppress
  coordinate-bearing query URLs wherever supported, and document any residual
  infrastructure exposure.
- Coordinate-bearing nearby responses must not be placed in a shared cache
  unless the cache key safely varies by the complete query and the privacy
  policy explicitly allows it. Prefer private/no-store behavior when that
  guarantee is unavailable.

If SSR gating is used, the only cookie is:

```text
qarib_location_complete=v1
```

Cookie attributes: `HttpOnly`, `SameSite=Lax`, `Path=/`, one-year `Max-Age`,
and `Secure` outside local development. Value indicates schema completion only.

### Discovery query XOR

Location-dependent requests use a discriminated union:

```ts
type DiscoveryLocation =
	| { mode: 'gps'; lat: number; lng: number; radius_km: 10 | 15 | 25 | 40 | 60 }
	| { mode: 'manual'; region_id: string };
```

- GPS event queries send `lat`, `lng`, and `radius_km`; they never send
  `region_id`.
- Manual event queries send `region_id`; they never send `lat`, `lng`, or
  `radius_km`.
- GPS nearby-place queries send `near_lat`, `near_lng`, and `radius_km`.
- Manual place queries send `region_id`; they never send `near_lat`,
  `near_lng`, or `radius_km`.
- Radius choices remain exactly `10`, `15`, `25`, `40`, and `60` km.
- Default GPS radius remains `10` km.
- Radius controls are disabled in manual mode with localized explanation:
  manual search follows selected city/kabupaten boundaries, so kilometre radius
  does not apply.
- Query keys include the discriminant and only fields valid for that mode.

### Visual and accessibility contract

- Orange denotes selected states and primary actions.
- Cream/paper tokens denote neutral controls and surfaces.
- Do not add arbitrary color literals when existing semantic tokens cover the
  state.
- Mobile settings uses an accessible bottom sheet; desktop uses an accessible
  modal.
- Dialog requirements: labelled title, described purpose, initial focus,
  trapped focus, Escape close, scrim close where cancellation is allowed, and
  focus return to the invoking settings button.
- Onboarding fields have visible labels, keyboard operation, focus styles,
  loading/error announcements, and no color-only state.
- GPS errors use `role="alert"`; async region loading uses polite status
  announcements.
- Touch targets are at least 44 by 44 CSS pixels.
- Reduced-motion preference is honored.

## Exact PR Decomposition

PR2 depends on PR1 and touches overlapping event/date surfaces. Do not run both
implementers concurrently.

| PR | Branch | Subject | Dependency |
|---|---|---|---|
| PR1 | `fix/web-kajian-client-timezone` | `fix(time): make browser timezone authoritative` | merged documentation PR |
| PR2 | `feat/web-location-onboarding-settings` | `feat(location): add onboarding gate and global settings` | merged PR1 |

Use wording `qarib-api runtime` in code comments, docs, and PR bodies. Deprecated
runtime terminology must not appear.

## Team Delegation and Shipping Rules

For each PR:

- Lead creates an isolated worktree under `../goscratch-<branch>`, owns scope,
  reviews diffs, runs final gates, updates this checklist, commits, pushes, and
  opens the PR.
- Implementer owns implementation files listed for that PR.
- Tester owns test files only after implementation APIs stabilize.
- Reviewer is read-only and checks contract, accessibility, privacy, and
  regression risk after gates pass.
- Devils-advocate is read-only and challenges timezone boundaries, redirect
  safety, stale marker recovery, storage privacy, and region/GPS XOR behavior.
- Implementer and tester must not commit, push, open a PR, or clean their
  worktrees. They report changed files and commands to lead.
- Every dispatched prompt includes branch, this scope file, exact file-set, and
  `do not commit / push / open PR — lead reviews then ships`.
- Agents do not edit overlapping files in parallel.
- Lead marks all applicable boxes in this plan before opening each PR.

---

## PR1 Checklist: Browser Timezone Contract

### Task 1: Lock explicit-offset date utilities

**Files:**

- Modify: `src/lib/shared/utils/date.ts`
- Modify: `src/lib/shared/utils/date.test.ts`
- Modify: `src/lib/shared/utils/index.ts`

- [ ] Preserve existing positive-offset, negative-offset, DST-transition, and
      browser-timezone-difference coverage.
- [ ] Add only the missing half-hour-offset boundary test.
- [ ] Add only the missing no-`Z` assertion proving boundaries remain
      explicit-offset RFC3339.
- [ ] Keep date construction based on local calendar fields. Do not use
      `toISOString()` in date-boundary helpers.
- [ ] Export only the shared helpers required by route components.
- [ ] Run `bun run test -- src/lib/shared/utils/date.test.ts`.

### Task 2: Remove server-host "today" from kajian detail

**Files:**

- Modify: `src/routes/(app)/kajian/[id]/+page.server.ts`
- Modify: `src/routes/(app)/kajian/[id]/+page.svelte`
- Create: `src/routes/(app)/kajian/[id]/kajian-timezone.test.ts`

- [ ] Preserve SSR fetch of the timezone-independent event series header.
- [ ] Remove the SSR occurrence request derived from
      `new Date().toISOString().slice(0, 10)`.
- [ ] Initialize browser-local date and explicit-offset `date_from` after mount.
- [ ] Keep the occurrence query disabled until browser date initialization.
- [ ] Do not seed occurrence query data generated from server timezone.
- [ ] Add tests proving an instant near midnight yields the browser-visible day,
      not UTC day.
- [ ] Add tests proving occurrence query arguments contain an explicit offset.
- [ ] Run
      `bun run test -- 'src/routes/(app)/kajian/[id]/kajian-timezone.test.ts'`.

### Task 3: Verify already-landed `/peta` timezone behavior

**Read only; do not modify in PR1:**

- `src/routes/(app)/peta/+page.svelte`
- `src/routes/(app)/peta/+page.server.ts`
- `src/routes/(app)/peta/peta-page.server.test.ts`

- [ ] Inspect `/peta` server load and confirm it still performs no
      server-host-derived nearby request.
- [ ] Grep existing `/peta` code for browser-local date initialization and
      explicit-offset date-range use.
- [ ] Run
      `bun run test -- 'src/routes/(app)/peta/peta-page.server.test.ts'`.
- [ ] Run
      `rg -n 'toISOString\(' 'src/routes/(app)' src/lib/shared/utils/date.ts`
      and classify every result; no calendar query boundary may use it.
- [ ] If verification fails, stop PR1 and record a separately scoped finding.
      Do not modify any read-only verification file in PR1.

### PR1 gates and completion

- [ ] `bun run check`
- [ ] `bun run lint`
- [ ] `bun run test`
- [ ] `bun run build`
- [ ] Reviewer pass complete.
- [ ] Devils-advocate pass complete.
- [ ] `docs/features/location-onboarding-settings.md` created with timezone
      behavior before PR opens.
- [ ] `CHANGELOG.md` `[Unreleased]` entry added before PR opens.
- [ ] All PR1 boxes above marked complete in this same PR.

### PR1 acceptance criteria

- [ ] No app query derives a calendar day from server host timezone.
- [ ] Date boundaries are explicit-offset RFC3339 and never UTC-normalized with
      `toISOString()`.
- [ ] Browser timezone works without a static named-zone configuration.
- [ ] Manual-region future work remains documented as browser-timezone-owned.

---

## PR2 Checklist: Location Onboarding and Global Settings

### Task 1: Versioned preference and return-target validation

**Files:**

- Create: `src/lib/core/location/preference.ts`
- Create: `src/lib/core/location/preference.test.ts`
- Create: `src/lib/core/location/return-to.ts`
- Create: `src/lib/core/location/return-to.test.ts`
- Modify: `src/lib/core/location/index.svelte.ts`
- Modify: `src/lib/core/location/index.svelte.test.ts`

- [ ] Write failing preference parser tests for valid GPS and manual records.
- [ ] Add rejection tests for unknown version, invalid coordinates, incomplete
      manual selection, malformed JSON, and unavailable storage.
- [ ] Add legacy-key cleanup test without migration to completed state.
- [ ] Implement read, write, and staged replacement APIs behind context DI.
- [ ] Keep active preference unchanged until replacement completion succeeds.
- [ ] Write safe `returnTo` tests for app paths with query strings.
- [ ] Reject absolute cross-origin URLs, protocol-relative URLs, encoded
      cross-origin tricks, credentials, fragments, and `/lokasi` loops.
- [ ] Default every rejected target to `/peta`.
- [ ] Run core location tests.

### Task 2: Regions domain

**Files:**

- Modify: `src/lib/core/api/endpoints.ts`
- Modify: `src/lib/core/api/endpoints.test.ts`
- Create: `src/lib/domains/regions/schema.ts`
- Create: `src/lib/domains/regions/service.ts`
- Create: `src/lib/domains/regions/service.test.ts`
- Create: `src/lib/domains/regions/queries.ts`
- Create: `src/lib/domains/regions/queries.test.ts`
- Create: `src/lib/domains/regions/index.ts`

- [ ] Register `regions.list` and `regions.get` through the typed endpoint
      registry.
- [ ] Implement cursor pagination through the qarib-api runtime.
- [ ] Request `limit=100` on every province page, follow `next_cursor` while
      `has_more`, then build options from regions whose `location_path` has one
      element.
- [ ] Request every city/kabupaten page with `parent=<province id>` and
      `limit=100`; follow `next_cursor` while `has_more` until complete.
- [ ] Preserve string region IDs; do not assume UUID.
- [ ] Ignore `location_tz` for calendar authority.
- [ ] Add tests for cursor accumulation, `limit=100`, province classification,
      empty results, and API errors.
- [ ] Add a multi-page city test proving page 2 uses the same parent and limit,
      passes page 1 `next_cursor`, and returns the complete combined city list.
- [ ] Run regions domain tests.

### Task 3: Mandatory SSR completion gate

**Files:**

- Create: `src/routes/(app)/+layout.server.ts`
- Create: `src/routes/(app)/app-location-gate.test.ts`
- Create: `src/routes/(app)/app-location-reconciliation.test.ts`
- Modify: `src/routes/(app)/+layout.svelte`

- [ ] Redirect every `(app)` request without
      `qarib_location_complete=v1`.
- [ ] Preserve pathname and search in validated `returnTo`.
- [ ] Confirm `/` and `/lokasi` never pass through this layout.
- [ ] Add client reconciliation for marker-present/preference-missing state.
- [ ] Block location-dependent child readiness until preference hydration.
- [ ] Use replacement navigation for stale-marker repair.
- [ ] Add tests for `/peta`, detail routes, query preservation, valid marker,
      and malformed marker.
- [ ] Add layout component tests for marker present with missing, malformed,
      unsupported-version, and semantically invalid local storage: child app
      content and queries remain disabled, then navigation replaces to recovery
      onboarding with validated `returnTo`.

### Task 4: `/lokasi` onboarding and completion action

**Files:**

- Create: `src/routes/lokasi/+page.server.ts`
- Create: `src/routes/lokasi/+page.svelte`
- Create: `src/routes/lokasi/lokasi-page.test.ts`
- Create: `src/lib/shared/composites/location-picker.svelte`
- Create: `src/lib/shared/composites/location-picker.test.ts`
- Modify: `messages/id.json`

- [ ] Server load normalizes `returnTo`, exposes only completion-marker presence,
      and exposes no location preference.
- [ ] Derive first-run, marker-recovery, storage-recovery, or replacement mode
      from marker presence plus validated client preference; never trust a query
      parameter to enable `Batal`.
- [ ] Completion action accepts only normalized `returnTo`; it accepts no
      coordinates or region fields.
- [ ] Completion action sets only the completion marker cookie with locked
      attributes.
- [ ] First-run shows GPS and manual province/city choices.
- [ ] GPS is requested only from direct user activation.
- [ ] GPS denial/unavailability switches focus toward manual selection and does
      not select Cirebon.
- [ ] Province change clears city.
- [ ] Save remains disabled until GPS success or complete province-city choice.
- [ ] Keep preference staged until completion action succeeds, then replace the
      single active storage record.
- [ ] Failed completion action preserves staged choice and announces error.
- [ ] Failed active-record write preserves the prior record and announces a
      storage error.
- [ ] Successful completion replaces navigation to safe `returnTo`.
- [ ] Replacement mode preloads current preference and shows `Batal`.
- [ ] Cancellation leaves active preference unchanged and replaces navigation
      to safe `returnTo`.
- [ ] Marker-recovery mode shows saved summary and
      `Lanjutkan dengan lokasi tersimpan`, sends no preference data, restores
      only the marker, does not rewrite storage, and never shows `Batal`.
- [ ] Storage-recovery mode requires a new explicit choice and never shows
      `Batal`.
- [ ] Add component tests for keyboard operation, disabled states, errors,
      staged replacement, all four route modes, marker-only restoration,
      no-cancel recovery behavior, and accessible names.

### Task 5: Enforce GPS/manual query XOR

**Files:**

- Modify: `src/lib/domains/events/service.ts`
- Modify: `src/lib/domains/events/service.test.ts`
- Modify: `src/lib/domains/events/queries.ts`
- Modify: `src/lib/domains/events/queries.test.ts`
- Modify: `src/lib/domains/places/service.ts`
- Modify: `src/lib/domains/places/service.test.ts`
- Modify: `src/lib/domains/places/queries.ts`
- Modify: `src/lib/domains/places/queries.test.ts`
- Modify: `src/routes/(app)/peta/+page.svelte`
- Modify: `src/routes/(app)/peta/peta-page.server.test.ts`

- [ ] Replace permissive optional location fields with discriminated GPS/manual
      query inputs.
- [ ] Add runtime guards at query construction so mixed or incomplete inputs
      fail before network dispatch.
- [ ] GPS events use `lat`, `lng`, and selected radius only.
- [ ] Manual events use city `region_id` only.
- [ ] GPS places use `near_lat`, `near_lng`, and selected radius only.
- [ ] Manual places use city `region_id` only.
- [ ] Keep radius steps `10/15/25/40/60` and default `10`.
- [ ] Disable radius interaction in manual mode and explain region-boundary
      behavior in localized copy.
- [ ] Remove the old default-Cirebon denied-GPS behavior.
- [ ] Reset selected pins and invalidate old-mode query data when location mode
      changes.
- [ ] Add exact URL assertions proving forbidden counterpart fields are absent.

### Task 6: Global settings in every app header

**Files:**

- Modify: `src/lib/shared/composites/app-header.svelte`
- Modify: `src/lib/shared/composites/header-mode.test.ts`
- Create: `src/lib/shared/composites/location-settings.svelte`
- Create: `src/lib/shared/composites/location-settings.test.ts`
- Modify: `src/routes/(app)/+layout.svelte`
- Modify: `messages/id.json`

- [ ] Render an accessible settings button in both home and back header modes.
- [ ] Keep layout-owned open state so every app route gets the same settings
      behavior.
- [ ] Render mobile bottom sheet and desktop modal from one semantic dialog.
- [ ] Show current GPS/manual summary.
- [ ] Add `Ganti lokasi` linking to `/lokasi` with current path and query as
      safe `returnTo`.
- [ ] Do not render `Hapus`, language controls, or a locale switcher.
- [ ] Use orange primary/selected controls and cream neutral controls.
- [ ] Implement focus trap, Escape close, focus restoration, labelled dialog,
      and reduced-motion handling.
- [ ] Add responsive and accessibility-focused component tests.

### Task 7: End-to-end flows

**Files:**

- Create: `e2e/location-onboarding.e2e.ts`
- Modify: `e2e/peta.e2e.ts`
- Modify: `e2e/smoke.e2e.ts`
- Modify: `e2e/upstream-stub.ts`

- [ ] Prove `/` loads without location marker.
- [ ] Prove direct `/peta?x=1` redirects to onboarding and returns to the same
      path/query after completion.
- [ ] Prove each representative detail route is gated.
- [ ] Prove GPS success sends `lat/lng/radius_km` and no `region_id`.
- [ ] Prove denied GPS cannot continue until manual city is selected.
- [ ] Prove manual completion sends `region_id` and no coordinate/radius fields.
- [ ] Prove default GPS radius is 10 and all five radius choices work.
- [ ] Prove returning settings opens on mobile and desktop.
- [ ] Prove `Ganti lokasi`, cancel, and completed replacement semantics.
- [ ] Prove Back after successful onboarding does not reopen onboarding.
- [ ] Prove settings contains neither `Hapus` nor language controls.
- [ ] With marker present and local storage missing, prove app content and
      nearby queries stay disabled and navigation replaces to storage recovery.
- [ ] Repeat stale-marker coverage with malformed and schema-invalid local
      storage.
- [ ] With valid local preference and marker missing, prove marker-recovery
      mode restores only the cookie, preserves storage unchanged, offers no
      `Batal`, and returns to the original app URL.
- [ ] Run Chromium e2e with at least two browser timezone configurations.

### Task 8: Documentation and final review

**Files:**

- Create: `docs/features/location-onboarding-settings.md`
- Modify: `README.md`
- Modify: `docs/README.md`
- Modify: `docs/charter.md`
- Modify: `docs/architecture/overview.md`
- Modify: `docs/architecture/folder-layout.md`
- Modify: `docs/guides/add-a-route.md`
- Modify as required: relevant `.claude/rules/*.md`
- Create or modify as required: relevant ADR under `docs/decisions/`
- Modify: `CHANGELOG.md`
- Modify: `docs/plans/location-onboarding-settings.md`

- [ ] Document first-run, returning, GPS denial, manual selection, persistence,
      privacy, query XOR, timezone, and settings behavior.
- [ ] Reconcile root `README.md`, `docs/README.md`, `docs/charter.md`,
      `docs/architecture/overview.md`, `docs/architecture/folder-layout.md`, and
      `docs/guides/add-a-route.md`: every canonical route/layer description must
      reflect completion-gated `(app)`, ungated `/` and `/lokasi`, client-only
      preference storage, and the region/GPS query contract.
- [ ] Update architecture wording from public-ungated `(app)` to
      completion-gated public browse without introducing account,
      authentication, authorization, or user-session semantics.
- [ ] Record the completion marker as preference state, not account/session
      state.
- [ ] Review relevant rules for route gating, state, API queries, security,
      logging, and caching. Update stale rules in the same implementation PR.
- [ ] Add an ADR when the completion-marker gate or coordinate-query
      logging/cache policy creates a durable architectural decision not already
      covered by accepted ADRs. Link it from canonical docs.
- [ ] Audit BFF/logger/tracing/hosting/CDN behavior for coordinate-bearing query
      URLs; implement available redaction/suppression and document residual
      infrastructure processing or retention.
- [ ] Verify coordinate-bearing nearby responses use a privacy-appropriate cache
      policy and cannot leak across users through an incomplete shared-cache key.
- [ ] Ensure user-facing privacy copy avoids zero-retention claims and accurately
      distinguishes client preference storage from infrastructure request
      processing.
- [ ] Add `[Unreleased]` changelog entry.
- [ ] Mark every completed PR2 task in this plan before opening PR.
- [ ] Grep documentation and changed code for deprecated runtime terminology;
      result must be empty.

### PR2 gates and completion

- [ ] `bun run check`
- [ ] `bun run lint`
- [ ] `bun run test`
- [ ] `bun run test:e2e`
- [ ] `bun run codegen` followed by clean generated diff, if endpoint types are
      touched.
- [ ] `bun run build`
- [ ] Reviewer pass complete.
- [ ] Devils-advocate pass complete.
- [ ] All PR2 boxes above marked complete in this same PR.

### PR2 acceptance criteria

- [ ] `/` is ungated; every `(app)` route is gated; `/lokasi` is ungated.
- [ ] Unsafe `returnTo` values cannot escape same origin or loop to onboarding.
- [ ] First-run cannot bypass location selection.
- [ ] Missing marker plus valid preference restores marker without resending or
      rewriting location preference and without a cancel loop.
- [ ] Present marker plus missing/invalid preference keeps app queries disabled
      until storage recovery completes.
- [ ] GPS denial requires manual city selection.
- [ ] Replacement cancellation preserves prior preference.
- [ ] No GPS coordinates or region details appear in cookies.
- [ ] No intentional Qarib Web application/server persistence exists beyond
      client local storage; infrastructure URL processing is reviewed,
      minimized, and documented without zero-retention claims.
- [ ] Coordinate-bearing request logging/redaction and response cache policy
      pass security/privacy review.
- [ ] Manual region search uses browser timezone.
- [ ] GPS/manual event and place requests satisfy strict XOR.
- [ ] Radius options and default exactly match product decision.
- [ ] Settings works from every app header on mobile and desktop.
- [ ] Settings has no delete or language controls.
- [ ] Accessibility behavior passes component and e2e coverage.

## Out of Scope

- User accounts, login, sessions, favorites, follows, or authorization.
- Server-side storage of location preference.
- Location analytics or coordinate logging.
- Reverse geocoding GPS coordinates into a city label.
- Automatic timezone selection from province, city, GPS coordinates, or
  `RegionResponse.location_tz`.
- Multiple saved locations.
- A delete/reset-location action.
- Language selection or additional locales.
- qarib-api runtime schema changes.
- Search, native mobile, offline behavior, background geolocation, and realtime
  updates.
