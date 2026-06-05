# Phase D, E, & F — Places, Ustadz, and Subjects Implementation & Refactoring Plan

**Goal:** Implement the detail pages for Venues/Places, Scholars (Asatidz), and Subjects (Tema), and integrate them with the new Event Series endpoints, clean up routing structure, and align the UI with the final Hi-Fi v2 specifications.

---

## Completed Implementations & Refactorings

### 1. Root Layout & Query Client Centralization
*   **Centralized QueryClientProvider:** Moved `@tanstack/svelte-query` initialization to the root layout ([src/routes/+layout.svelte](file:///Users/maulanazain/Documents/Projects/qarib/qarib-web/src/routes/+layout.svelte)), eliminating local query client instantiations inside individual pages.
*   **App Shell Container:** Standardized a max-width readable column container (`max-w-2xl px-4 mx-auto`) and default background colors inside the main layout ([src/routes/(app)/+layout.svelte](file:///Users/maulanazain/Documents/Projects/qarib/qarib-web/src/routes/(app)/+layout.svelte)).
*   **SSR Initial Data Hydration:** Refactored server loaders (`+page.server.ts`) for detail routes to fetch database responses on the server side and pass them to Svelte-query as `initialData`, preventing client-side loading waterfalls.

### 2. Generalization of Venues: `/masjid` to `/tempat` (Phase D)
*   **Route Generalization:** Renamed the `/masjid/[id]` route structure to `/tempat/[id]` to represent a generalized "place/venue" concept beyond just mosques.
*   **Place Detail Page:** Implemented the place profile page ([src/routes/(app)/tempat/[id]/+page.svelte](file:///Users/maulanazain/Documents/Projects/qarib/qarib-web/src/routes/(app)/tempat/[id]/+page.svelte)) to fetch venue details via `places.get` and their upcoming kajian event series via `events.listSeries`.
*   **Action Actions & Map Integration:** Enabled direction linking, phone calls, and localized sharing handlers alongside a Leaflet mini-map.

### 3. Scholar Profile Detail: `/ustadz` (Phase E)
*   **Ustadz Detail Page:** Implemented [src/routes/(app)/ustadz/[id]/+page.svelte](file:///Users/maulanazain/Documents/Projects/qarib/qarib-web/src/routes/(app)/ustadz/[id]/+page.svelte) to render scholar information (bio, alias, initials-based avatars) and a list of active event series filtered by `asatidz_id`.

### 4. Topic/Subject Detail: `/tema` (Phase F)
*   **Subject Page:** Implemented [src/routes/(app)/tema/[id]/+page.svelte](file:///Users/maulanazain/Documents/Projects/qarib/qarib-web/src/routes/(app)/tema/[id]/+page.svelte) to group kajian events by topic/subject UUID.
*   **Derived Aggregates:** Implemented clean, client-side reactive derivations for unique scholars count, unique places count, and upcoming series count, alongside a mini-chip list of active scholars.

### 5. Event Card Redesign & Series Transition
*   **Hi-Fi v2 Layout:** Upgraded the shared [event-card.svelte](file:///Users/maulanazain/Documents/Projects/qarib/qarib-web/src/lib/domains/events/components/event-card.svelte) component. It now features:
    *   *Left timebox:* Clear event start time box with the corresponding prayer time label.
    *   *Right column details:* Reactive rendering of subject, title, scholar, venue name, relative distance, and status badge.
*   **Series Over Occurrences:** Repointed all detail feeds to fetch Event Series (`/events/series`) instead of individual occurrences (`/events/list`), matching the latest `qarib-api` upstream updates.
*   **Domain Wrappers:** Added custom local wraps ([ustadz/[id]/EventCard.svelte](file:///Users/maulanazain/Documents/Projects/qarib/qarib-web/src/routes/(app)/ustadz/[id]/EventCard.svelte) and [tempat/[id]/EventCard.svelte](file:///Users/maulanazain/Documents/Projects/qarib/qarib-web/src/routes/(app)/tempat/[id]/EventCard.svelte)) that dynamically fetch subject details and hide parent context links (e.g., hiding the scholar link when browsing a scholar's profile page).

---

## File Changes Overview

### [NEW]
*   [src/lib/shared/utils/l10n.ts](file:///Users/maulanazain/Documents/Projects/qarib/qarib-web/src/lib/shared/utils/l10n.ts) (L10n translation helper)
*   [src/routes/(app)/tempat/[id]/+page.server.ts](file:///Users/maulanazain/Documents/Projects/qarib/qarib-web/src/routes/(app)/tempat/[id]/+page.server.ts) (Place loader)
*   [src/routes/(app)/tempat/[id]/+page.svelte](file:///Users/maulanazain/Documents/Projects/qarib/qarib-web/src/routes/(app)/tempat/[id]/+page.svelte) (Place details view)
*   [src/routes/(app)/tempat/[id]/EventCard.svelte](file:///Users/maulanazain/Documents/Projects/qarib/qarib-web/src/routes/(app)/tempat/[id]/EventCard.svelte) (Place-specific EventCard wrapper)
*   [src/routes/(app)/ustadz/[id]/EventCard.svelte](file:///Users/maulanazain/Documents/Projects/qarib/qarib-web/src/routes/(app)/ustadz/[id]/EventCard.svelte) (Ustadz-specific EventCard wrapper)

### [DELETE]
*   `src/routes/(app)/masjid/[id]/+page.server.ts` (Superceded by `/tempat/[id]`)
*   `src/routes/(app)/masjid/[id]/+page.svelte` (Superceded by `/tempat/[id]`)

### [MODIFY]
*   [openapi/upstream.yaml](file:///Users/maulanazain/Documents/Projects/qarib/qarib-web/openapi/upstream.yaml) (Added `/events/series` and `PaginatedEventSeriesResponse` schema)
*   [src/lib/domains/events/components/event-card.svelte](file:///Users/maulanazain/Documents/Projects/qarib/qarib-web/src/lib/domains/events/components/event-card.svelte) (Upgraded layout and props)
*   [src/lib/domains/events/queries.ts](file:///Users/maulanazain/Documents/Projects/qarib/qarib-web/src/lib/domains/events/queries.ts) (Added series list query helper)
*   [src/lib/domains/events/service.ts](file:///Users/maulanazain/Documents/Projects/qarib/qarib-web/src/lib/domains/events/service.ts) (Added fetchEventSeriesList client function)
*   [src/routes/+layout.svelte](file:///Users/maulanazain/Documents/Projects/qarib/qarib-web/src/routes/+layout.svelte) (Wired QueryClientProvider)
*   [src/routes/(app)/+layout.svelte](file:///Users/maulanazain/Documents/Projects/qarib/qarib-web/src/routes/(app)/+layout.svelte) (Added standard container margins)
*   [src/routes/(app)/kajian/[id]/+page.svelte](file:///Users/maulanazain/Documents/Projects/qarib/qarib-web/src/routes/(app)/kajian/[id]/+page.svelte) (Hydrated initial data, replaced skeleton classes)
*   [src/routes/(app)/ustadz/[id]/+page.svelte](file:///Users/maulanazain/Documents/Projects/qarib/qarib-web/src/routes/(app)/ustadz/[id]/+page.svelte) (Migrated to series queries and localized strings helper)
*   [src/routes/(app)/tema/[id]/+page.svelte](file:///Users/maulanazain/Documents/Projects/qarib/qarib-web/src/routes/(app)/tema/[id]/+page.svelte) (Migrated to series queries and statistics count)
