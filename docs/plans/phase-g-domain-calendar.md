# Plan: Domain Calendar View ("Kalender Lengkap Kajian")

## Context

Domain detail pages (`/tema/[id]`, `/ustadz/[id]`, `/tempat/[id]`) currently show events as a flat list of series templates. The Hi-fi v2 design specifies a month-grid calendar view ("Kalender lengkap kajian") that shows actual occurrence dates as markers on a calendar. The tempat page already has a "Lihat jadwal lengkap" button placeholder (`TODO(phase-E)`). The kajian detail page has a "Lihat kalender lengkap" button and a 15-day mini strip as reference.

## What gets built

A reusable `MonthCalendar` composite component placed inline on each domain detail page, toggled via a button. The calendar fetches occurrences (`events.list`) filtered by domain + date range and renders colored dots on dates that have sessions.

## Files to create

### 1. `src/lib/shared/composites/month-calendar.svelte`
Reusable month-grid calendar composite. Prop-driven, no domain knowledge.

**Props:**
```ts
domainName: string         // calendar title, e.g. "Kalender Sirah Nabawiyah"
eventDates: Set<string>    // ISO dates ("2026-06-15") that have occurrences
loading?: boolean
error?: string | null
onRetry?: () => void
onDateClick?: (isoDate: string) => void
```

**Internal state:** `currentAnchor` (ISO date of month being viewed, defaults to today). Prev/next buttons call `shiftCalendarMonth(currentAnchor, ±1)`.

**Structure:**
- Header row: `<` button + "Juni 2026" label (via `getMonthYearLabel`) + `>` button
- Weekday header row: 7 cols (Min, Sen, Sel, Rab, Kam, Jum, Sab) via existing `getWeekdayLabels('id-ID')`
- 6-row × 7-col grid of day cells (42 total, padding cells from adjacent months)
- Each cell: day number + colored dot (6px `rounded-full bg-orange`) if `eventDates.has(isoDate)`
- Today: outline ring + `aria-current="date"`
- Non-current-month cells: muted opacity
- Loading: 42 skeleton squares in grid layout
- Error: inline error state with retry button
- Empty: grid still renders (no dots), optional subtle "no events" caption

**Grid generation** uses new `getMonthGrid(anchorDate)` pure function (see below).

**Accessibility:** Day cells are `<button>` with `aria-label="Pilih {date}"`. Arrow key navigation between cells.

### 2. `src/lib/shared/composites/month-calendar.test.ts`
- Tests for `deriveEventDates` (extract ISO dates from occurrence list)
- Month navigation behavior
- Empty event list → grid renders with no dots
- Event dates outside current month → dots only on current-month cells

## Files to modify

### 3. `src/lib/shared/utils/date.ts` — add two exports

```ts
export interface CalendarDay {
  isoDate: string     // "2026-06-01"
  day: number         // 1-31
  isCurrentMonth: boolean
  isToday: boolean
}

export function getMonthGrid(anchorDate: string): CalendarDay[]
// Returns 42 CalendarDay cells (6 weeks × 7 days).
// Pads start to preceding Sunday, end to following Saturday.
// isToday compares against new Date() local date.

export function getMonthYearLabel(dateStr: string, locale?: string): string
// Returns "Juni 2026" via Intl.DateTimeFormat.
```

Reuses existing: `shiftCalendarMonth`, `getWeekdayLabels`, `addIsoDateDays`, `toLocalIsoDate`.

### 4. `src/lib/shared/utils/date.test.ts` — add tests
- `getMonthGrid` returns 42 cells, correct first/last date, correct `isCurrentMonth` flags, correct `isToday`
- `getMonthYearLabel` returns Indonesian month-year format

### 5. `messages/id.json` — add i18n keys

```json
"calendar_title": "Kalender {domain}",
"calendar_prev_month": "Bulan sebelumnya",
"calendar_next_month": "Bulan berikutnya",
"calendar_loading": "Memuat kalender…",
"calendar_empty": "Tidak ada kajian di bulan ini",
"calendar_error_title": "Kalender tidak bisa dimuat",
"calendar_error_body": "Periksa sambunganmu lalu coba lagi.",
"calendar_date_label": "Pilih {date}",
"calendar_today_label": "Hari ini, {date}",
"calendar_toggle_list": "Lihat daftar",
"calendar_toggle_calendar": "Lihat kalender"
```

Existing keys reused: `kajian_schedule_see_full`, `kajian_no_upcoming`.

### 6. `src/lib/domains/events/queries.ts` — add calendar query

```ts
// New event key
domainCalendar: (args: { domainType: string; domainId: string; dateFrom: string; dateTo: string }) =>
  ['events', 'domainCalendar', args] as const,

// New query factory
export function defineDomainCalendarQuery(
  args: { domainType: 'subject' | 'asatidz' | 'place'; domainId: string; dateFrom: string; dateTo: string },
  opts?: { enabled?: boolean; staleTime?: number; requestId?: string }
)
// Maps domainType → correct filter field, calls events.list with date range + limit: 200

// Pure utility (exported for testing)
export function deriveEventDates(occurrences: EventRecurringResponse[]): Set<string>
// Extracts date_start.substring(0, 10) for each occurrence → Set<string>
```

### 7. `src/lib/domains/events/queries.test.ts` — add tests
- `domainCalendar` key is constructed correctly
- `defineDomainCalendarQuery` maps domainType → correct filter field
- `deriveEventDates` extracts dates, deduplicates, handles missing date_start

### 8. `src/routes/(app)/tema/[id]/+page.svelte` — integrate calendar

Add between stat row / ustadz carousel and jadwal section:
- Toggle button: "Lihat kalender" / "Lihat daftar" (swaps view)
- `let showCalendar = $state(false)`
- `let calendarAnchor = $state(toLocalIsoDate(new Date()))`
- Calendar query (enabled only when `showCalendar`):
  ```ts
  const calendarQuery = defineDomainCalendarQuery({
    domainType: 'subject', domainId: id,
    get dateFrom() { return toDateRange(monthStart).date_from },
    get dateTo() { return toDateRange(monthEnd).date_to },
  }, { get enabled() { return showCalendar } })
  ```
- Compute `monthStart` / `monthEnd` from `calendarAnchor` (1st of month → last day of month + 7-day padding for boundary events)
- `eventDates = $derived(deriveEventDates(calendarQuery.data?.data ?? []))`
- `onDateClick` → filter the event list to that date, scroll to list

When calendar is visible, event list below filters to clicked date (or shows all if no date selected). Add "Menampilkan kajian pada {date}" header + "Tampilkan semua" reset button.

### 9. `src/routes/(app)/ustadz/[id]/+page.svelte` — same pattern

Filter field: `asatidz_id`. Calendar title uses ustadz name.

### 10. `src/routes/(app)/tempat/[id]/+page.svelte` — same pattern

Filter field: `place_id`. Calendar title uses place name. Replace the existing disabled "Lihat jadwal lengkap" button with the working toggle.

## Data flow

```
Page toggle → showCalendar = true → calendarQuery enabled
  → api('events.list', { subject_id/asatidz_id/place_id, date_from, date_to, limit: 200 })
  → deriveEventDates(response.data) → Set<string> of ISO dates
  → MonthCalendar receives eventDates prop → renders dots
  → User clicks date → onDateClick(isoDate) → page filters event list
```

## Important: series vs occurrences

Current pages fetch series templates via `events.listSeries`. The calendar fetches **occurrences** via `events.list` with date range. These are separate queries with different response types. The calendar data does NOT replace the series list — it's a complementary view.

## Date range padding

Query `date_from` = 1st of month minus 7 days, `date_to` = last day of month plus 7 days. This captures boundary occurrences that may show on padding cells of the grid.

## Implementation order

1. `date.ts` — add `getMonthGrid`, `getMonthYearLabel`, `CalendarDay` type
2. `date.test.ts` — tests for new functions
3. `messages/id.json` — i18n keys
4. `events/queries.ts` — add `domainCalendar` key, `defineDomainCalendarQuery`, `deriveEventDates`
5. `events/queries.test.ts` — query tests
6. `month-calendar.svelte` — the composite component
7. `month-calendar.test.ts` — component logic tests
8. Integrate into `/tema/[id]/+page.svelte` (first domain)
9. Integrate into `/ustadz/[id]/+page.svelte`
10. Integrate into `/tempat/[id]/+page.svelte`
11. E2E test: `e2e/calendar-view.e2e.ts`
12. Run full CI gate: `bun run check && bun run lint && bun run test && bun run test:e2e && bun run build`

## Verification

- `bun run test` — all unit tests pass
- `bun run test:e2e` — calendar Playwright spec passes
- Manual: navigate to `/tema/[id]`, toggle calendar, navigate months, click date with events → list filters
- Manual: repeat for `/ustadz/[id]` and `/tempat/[id]`
- Accessibility: keyboard navigate calendar grid, screen reader announces dates
