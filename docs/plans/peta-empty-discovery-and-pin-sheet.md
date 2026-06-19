# Peta Empty Discovery and Pin Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/peta` empty results interactive instead of blocking, add a bounded `Pekan ini` discovery mode, and make every map pin open a bottom sheet before any place navigation.

**Architecture:** Split map discovery from selected-place inspection. The global date/radius/subject filters decide which pins appear on the map; the selected-place PinSheet gets its own 7-day occurrence data and local day chips. Global filters seed PinSheet state on open, but PinSheet chip changes never mutate global filters.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, TanStack Svelte Query, Paraglide, Vitest, Playwright.

---

## Locked Product Decisions

- Global date filter options are `Hari ini`, `Besok`, `Pekan ini`, and `Tanggal lain`.
- `Pekan ini` means local calendar day `today` through `today + 7 days`, inclusive.
- Global filters affect PinSheet only when a place is opened. PinSheet chip changes do not affect global filters.
- PinSheet must not be fed only by the global map query. It needs selected-place occurrence data for the next 7 days.
- Clicking any map pin opens PinSheet first. Navigation to place detail happens only through explicit `Buka detail masjid`.
- Empty state primary action is `Lihat masjid sekitar`. It hides the empty sheet until global date, radius, subject, or location context changes.
- Empty future suggestions use bounded `Pekan ini` language. Avoid vague `Kajian mendatang` unless the implemented range exceeds 7 days.
- Future suggestions should respect the selected subject filter. A user filtering `Fiqih` should not see unrelated events in the selected-place sheet.
- Do not silently widen radius to 60 km for future suggestions. Radius expansion remains explicit through the existing radius control/action.

## File Map

- Modify `src/routes/(app)/peta/+page.svelte`
  - Owns map query args, empty-state rendering, filter sheet actions, selected-place data composition, and pin click behavior.
- Create `src/routes/(app)/peta/date-mode.ts`
  - Pure route-local helpers for global date mode, date ranges, chip labels, and PinSheet default bucket mapping.
- Create `src/routes/(app)/peta/date-mode.test.ts`
  - Unit tests for date-mode range and PinSheet bucket mapping.
- Modify `src/lib/domains/events/store.svelte.ts`
  - Replace ambiguous selected-date-only state with explicit global date mode plus optional custom ISO date.
- Modify `src/lib/shared/composites/pin-sheet.svelte`
  - Allow place-only and no-event states; render empty copy instead of requiring at least one event.
- Modify `src/lib/shared/composites/pin-sheet.test.ts`
  - Keep bucket tests aligned with `today`, `tomorrow`, `week`.
- Modify `src/lib/domains/events/place-pins.ts`
  - Keep place-pin grouping helpers; remove or rename future suggestion concepts that still imply open-ended `mendatang`.
- Modify `src/lib/domains/events/place-pins.test.ts`
  - Update grouping tests to bounded week semantics if helper behavior changes.
- Modify `messages/id.json`
  - Add `Pekan ini`, `Lihat masjid sekitar`, selected-place empty copy, and revised empty-state copy.
- Modify `e2e/peta.e2e.ts`
  - Replace current tests that assert `Cek besok`, direct place redirect, and open-ended future language.
- Modify `e2e/upstream-stub.ts`
  - Add stubs for selected-place occurrence list via `/events?place_id=...`.
- Update `docs/features/location-onboarding-settings.md` only if `/peta` feature behavior is currently documented there. Otherwise leave feature docs alone.
- Update `CHANGELOG.md` under `[Unreleased]`.

## Stale Code To Remove Or Rewrite

- `fallbackDateRange`, `fallbackArgs`, `fallbackQuery`, `fallbackEvents`, and `fallbackPlaces` in `src/routes/(app)/peta/+page.svelte` if they continue to mean "tomorrow through +14 days at max radius".
- Empty-state `Cek besok` action and message that always suggests tomorrow.
- `handlePinClick()` branch that immediately calls `navigateToPlace(placeId)` for place-only pins.
- `selectedPlaceHasTodayEvents` gate that prevents PinSheet from opening for place-only pins.
- Fallback rows that navigate directly to `/tempat/[id]`.
- User-facing `mendatang` labels when result range is exactly `Pekan ini`.
- Tests that intentionally assert stale behavior:
  - `empty filtered results keep the map visible, expand radius, and group future place suggestions` currently expects `Cek besok`.
  - Same test currently expects fallback row click to navigate to `/tempat/place-future-1`.

## Task 1: Add Route-Local Date Mode Helpers

**Files:**
- Create: `src/routes/(app)/peta/date-mode.ts`
- Create: `src/routes/(app)/peta/date-mode.test.ts`

- [ ] **Step 1: Write failing tests for date mode ranges**

Add tests covering `today`, `tomorrow`, `week`, and `custom`.

Expected assertions:
- `today` uses `today` through `today`.
- `tomorrow` uses `today + 1` through `today + 1`.
- `week` uses `today` through `today + 7`.
- `custom` uses the selected custom date through itself.
- `dateModeToPinDay('week')` returns first non-empty bucket when counts are provided.

Run:

```bash
bun run test -- src/routes/'(app)'/peta/date-mode.test.ts
```

Expected: FAIL because file/helper does not exist.

- [ ] **Step 2: Implement helper**

Create `date-mode.ts` with:

```ts
import { addIsoDateDays, toDateRange } from '$lib/shared/utils/date.js';

export type PetaDateMode = 'today' | 'tomorrow' | 'week' | 'custom';
export type PinDay = 'today' | 'tomorrow' | 'week';

export interface PetaDateSelection {
	mode: PetaDateMode;
	customDate: string | null;
}

export interface PinDayCounts {
	today: number;
	tomorrow: number;
	week: number;
}

export function selectedIsoForMode(todayIso: string, selection: PetaDateSelection): string {
	if (selection.mode === 'tomorrow') return addIsoDateDays(todayIso, 1);
	if (selection.mode === 'custom' && selection.customDate) return selection.customDate;
	return todayIso;
}

export function dateRangeForMode(
	todayIso: string,
	selection: PetaDateSelection
): { date_from: string; date_to: string } {
	const startIso = selectedIsoForMode(todayIso, selection);
	const endIso = selection.mode === 'week' ? addIsoDateDays(todayIso, 7) : startIso;
	const start = toDateRange(startIso);
	const end = toDateRange(endIso);
	return { date_from: start.date_from, date_to: end.date_to };
}

export function dateModeToInitialPinDay(
	mode: PetaDateMode,
	counts?: PinDayCounts
): PinDay {
	if (mode === 'tomorrow') return 'tomorrow';
	if (mode === 'week' && counts) {
		if (counts.today > 0) return 'today';
		if (counts.tomorrow > 0) return 'tomorrow';
		if (counts.week > 0) return 'week';
	}
	if (mode === 'week') return 'today';
	return 'today';
}
```

- [ ] **Step 3: Run helper tests**

Run:

```bash
bun run test -- src/routes/'(app)'/peta/date-mode.test.ts
```

Expected: PASS.

## Task 2: Make Global Date State Explicit

**Files:**
- Modify: `src/lib/domains/events/store.svelte.ts`
- Modify: `src/routes/(app)/peta/+page.svelte`
- Modify: `messages/id.json`

- [ ] **Step 1: Update view service state**

Replace ambiguous `selectedDate` with explicit fields:

```ts
selectedDateMode = $state<'today' | 'tomorrow' | 'week' | 'custom'>('today');
selectedCustomDate = $state<string | null>(null);
```

Add methods:

```ts
selectDateMode(mode: 'today' | 'tomorrow' | 'week' | 'custom', customDate: string | null = null): void {
	this.selectedDateMode = mode;
	this.selectedCustomDate = mode === 'custom' ? customDate : null;
}
```

Keep `selectDate(date: string | null)` temporarily only if other code still imports it. If only `/peta` uses it, remove it in Task 7.

- [ ] **Step 2: Replace `/peta` derived date range**

Use `dateRangeForMode(todayIso, { mode: eventsView.selectedDateMode, customDate: eventsView.selectedCustomDate })`.

The main `queryArgs` must keep:

```ts
date_from: dateRange?.date_from,
date_to: dateRange?.date_to
```

- [ ] **Step 3: Add `Pekan ini` to date sheet**

Add message keys:

```json
"peta_filter_date_week": "Pekan ini",
"peta_map_empty_places_action": "Lihat masjid sekitar"
```

Date sheet order:
1. `Hari ini`
2. `Besok`
3. `Pekan ini`
4. `Tanggal lain`

- [ ] **Step 4: Run checks**

Run:

```bash
bun run check
```

Expected: PASS.

## Task 3: Add Selected-Place Week Data For PinSheet

**Files:**
- Modify: `src/routes/(app)/peta/+page.svelte`
- Reuse: `defineEventListQuery` from `src/lib/domains/events/queries.ts`

- [ ] **Step 1: Write/adjust E2E expectation**

Update `e2e/peta.e2e.ts` so selecting a place-only pin opens PinSheet instead of redirecting.

Expected Playwright assertions:

```ts
await placePinMarkers(page).first().click();
await expect(page.getByRole('complementary', { name: /Masjid/ })).toBeVisible();
await expect(page).toHaveURL(/\/peta$/);
```

- [ ] **Step 2: Add selected-place query**

In `+page.svelte`, derive selected-place 7-day range from `todayIso`:

```ts
const selectedPlaceRange = $derived(
	todayIso
		? {
				date_from: toDateRange(todayIso).date_from,
				date_to: toDateRange(addIsoDateDays(todayIso, 7)).date_to
			}
		: null
);
```

Call `defineEventListQuery` with:

```ts
const selectedPlaceEventsQuery = defineEventListQuery(
	{
		place_id: eventsView.selectedPlaceId ?? undefined,
		subject_id: eventsView.selectedSubjectId ?? undefined,
		date_from: selectedPlaceRange?.date_from,
		date_to: selectedPlaceRange?.date_to,
		expand: 'place',
		limit: 30
	},
	{
		enabled: browserReady && eventsView.selectedPlaceId != null && selectedPlaceRange != null,
		staleTime: 60_000
	}
);
```

- [ ] **Step 3: Feed PinSheet from selected-place data**

Change `sheetEvents` to use `selectedPlaceEventsQuery.data?.data ?? []`, not the global map `events`.

Build `sheetPlace` from first available source in this order:
1. selected-place occurrence place
2. current global event occurrence place
3. nearby place list record
4. week suggestion occurrence place if still present during migration

- [ ] **Step 4: Seed PinSheet chip from global date mode on open**

In `handlePinClick(placeId)`, always call `eventsView.selectPlace(placeId)`.

Set `activePinDay` from global date mode:

```ts
activePinDay = dateModeToInitialPinDay(eventsView.selectedDateMode);
```

After selected-place query loads, if global mode is `week`, update once to first non-empty bucket. Do not update again after user manually changes PinSheet chip.

## Task 4: Make Every Pin Open Sheet First

**Files:**
- Modify: `src/routes/(app)/peta/+page.svelte`
- Modify: `src/lib/shared/composites/pin-sheet.svelte`
- Modify: `messages/id.json`

- [ ] **Step 1: Remove direct redirect from pin click**

Replace:

```ts
if (hasTodayEvent) {
	eventsView.selectPlace(placeId);
} else {
	navigateToPlace(placeId);
}
```

with:

```ts
eventsView.selectPlace(placeId);
activePinDay = dateModeToInitialPinDay(eventsView.selectedDateMode);
```

- [ ] **Step 2: Render PinSheet for place-only pins**

Change render gate from:

```svelte
{#if eventsView.selectedPlaceId != null && sheetPlace != null && selectedPlaceHasTodayEvents}
```

to:

```svelte
{#if eventsView.selectedPlaceId != null && sheetPlace != null}
```

- [ ] **Step 3: Add no-event PinSheet copy**

Add messages:

```json
"pin_sheet_no_events_title": "Belum ada kajian pekan ini",
"pin_sheet_no_events_body": "Masjid ini belum punya jadwal kajian untuk pekan ini."
```

In `PinSheet`, when `events.length === 0`, show place strip plus no-event copy and `Buka detail masjid`.

- [ ] **Step 4: Run focused tests**

Run:

```bash
bun run test -- src/lib/shared/composites/pin-sheet.test.ts
```

Expected: PASS.

## Task 5: Replace Blocking Empty State With Discovery Pivot

**Files:**
- Modify: `src/routes/(app)/peta/+page.svelte`
- Modify: `messages/id.json`
- Modify: `e2e/peta.e2e.ts`

- [ ] **Step 1: Track empty-sheet dismissal by query context**

Add:

```ts
let emptySheetDismissedForKey = $state<string | null>(null);
const showEmptySheet = $derived(
	!query.isPending &&
		!query.isError &&
		events.length === 0 &&
		!showLocationNotice &&
		emptySheetDismissedForKey !== queryContextKey
);
```

Use `showEmptySheet` in the empty-state `{#if}`.

- [ ] **Step 2: Add `Lihat masjid sekitar` action**

Replace `Cek besok` with:

```svelte
<button
	class="edge-sheet__button edge-sheet__button--secondary"
	onclick={() => {
		emptySheetDismissedForKey = queryContextKey;
	}}
>
	{m.peta_map_empty_places_action()}
</button>
```

- [ ] **Step 3: Update empty copy**

Replace current body with copy that does not force tomorrow:

```json
"peta_map_empty_body": "Tidak ada kajian untuk radius {radius} km pada tanggal ini. Kamu bisa perluas radius atau lihat masjid sekitar."
```

If global mode is `week`, use a separate key:

```json
"peta_map_empty_week_body": "Tidak ada kajian pekan ini untuk radius {radius} km. Kamu bisa perluas radius atau lihat masjid sekitar."
```

- [ ] **Step 4: Update E2E**

Expected assertions:

```ts
await expect(emptySheet.getByRole('button', { name: 'Lihat masjid sekitar' })).toBeVisible();
await emptySheet.getByRole('button', { name: 'Lihat masjid sekitar' }).click();
await expect(emptySheet).toHaveCount(0);
await expect(placePinMarkers(page).first()).toBeVisible();
```

## Task 6: Make `Pekan ini` A Real Global Mode

**Files:**
- Modify: `src/routes/(app)/peta/+page.svelte`
- Modify: `e2e/peta.e2e.ts`
- Modify: `e2e/upstream-stub.ts`

- [ ] **Step 1: Add E2E for week mode query range**

Test flow:
1. Open `/peta`.
2. Open date sheet.
3. Click `Pekan ini`.
4. Wait for `/events/nearby`.
5. Assert `date_from` starts with today's local date and `date_to` starts with `today + 7`.
6. Assert date chip shows `Pekan ini`.

- [ ] **Step 2: Route query handles week mode**

Use helper from Task 1. Do not maintain duplicate date logic in `+page.svelte`.

- [ ] **Step 3: Date filter sheet active state**

Each date option must reflect `eventsView.selectedDateMode`, not compare only ISO strings.

- [ ] **Step 4: Custom date behavior**

Clicking a date in the calendar must call:

```ts
eventsView.selectDateMode('custom', day.iso);
```

## Task 7: Clean Stale Fallback And Naming

**Files:**
- Modify: `src/routes/(app)/peta/+page.svelte`
- Modify: `src/lib/domains/events/place-pins.ts`
- Modify: `messages/id.json`
- Modify: `e2e/peta.e2e.ts`

- [ ] **Step 1: Delete hidden max-radius future fallback**

Remove old fallback query code if it still uses:
- tomorrow through +14 days
- `MAX_RADIUS_KM`
- `limit: 30`
- `peta_future_places_title`

- [ ] **Step 2: Rename bounded future wording**

Use:

```json
"peta_week_places_title": "Kajian pekan ini di sekitar"
```

Only keep `peta_future_places_title` if a separate open-ended future feature remains. If unused, delete it.

- [ ] **Step 3: Remove obsolete variables**

Delete or rename:
- `tomorrowIso` if it exists only for `Cek besok`
- `fallbackDateRange`
- `fallbackArgs`
- `fallbackQuery`
- `fallbackEvents`
- `fallbackPlaces`
- `selectedPlaceHasTodayEvents`

- [ ] **Step 4: Run grep checks**

Run:

```bash
rg "Cek besok|peta_map_empty_tomorrow_action|fallbackDateRange|selectedPlaceHasTodayEvents|Kajian mendatang|kajian mendatang" src messages e2e
```

Expected: no stale references unless intentionally kept with a comment explaining why.

## Task 8: Verification

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add changelog entry**

Under `[Unreleased]`, add:

```md
- Improved `/peta` empty-state discovery with nearby mosque browsing, bounded week filtering, and non-redirecting pin sheets.
```

- [ ] **Step 2: Run unit tests**

Run:

```bash
bun run test -- src/routes/'(app)'/peta/date-mode.test.ts src/lib/shared/composites/pin-sheet.test.ts src/lib/domains/events/place-pins.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run Svelte check**

Run:

```bash
bun run check
```

Expected: PASS.

- [ ] **Step 4: Run `/peta` E2E**

Run:

```bash
STADIA_API_KEY=test-stadia-key bun run test:e2e -- e2e/peta.e2e.ts
```

Expected: PASS.

- [ ] **Step 5: Run lint**

Run:

```bash
bun run lint
```

Expected: PASS.

## Implementation Notes

- Use a feature branch/worktree for implementation, for example `fix/peta-empty-discovery`.
- Keep one PR focused on `/peta`; do not mix unrelated map tile, auth, or onboarding changes.
- Do not force-push shared branches.
- If a helper is route-specific, keep it under `src/routes/(app)/peta/` instead of promoting it to shared domain code.
- If selected-place event query repeats enough logic to justify reuse, add a small events-domain query helper after tests prove the route need. Do not abstract first.
- PinSheet remains presentational: no fetching, routing, or geolocation inside `pin-sheet.svelte`.
