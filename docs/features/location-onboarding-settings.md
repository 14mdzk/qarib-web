# Location Onboarding & Settings

## Overview

Every visitor must choose a location before accessing app routes. Qarib Web uses a
privacy-preserving completion marker (cookie) paired with a versioned client-side
preference (localStorage). No coordinates, region IDs, or names ever appear in
cookies or server-side storage.

**v1 scope:** public read-only, Bahasa-only, no accounts.

## Route gate

| Route | Gated |
|---|---|
| `/` (landing) | No |
| `/lokasi` (onboarding) | No |
| `(app)/*` (/peta, /kajian/[id], …) | Yes |

A missing or invalid `qarib_location_complete=v1` cookie on any `(app)` route
triggers a server-side 303 redirect to `/lokasi?returnTo=<validated path>`.

## Onboarding modes

Derived from completion marker (cookie) + client preference (localStorage). A
query parameter never grants cancel or replacement behavior.

| Marker | Preference | Mode | Behavior |
|---|---|---|---|
| missing | missing/invalid | first-run | GPS or manual province→city; no cancel |
| missing | valid | marker recovery | Show saved summary; restore only cookie; no cancel |
| present | missing/invalid | storage recovery | Require new choice; app queries disabled until fixed |
| present | valid | replacement | Prefill current; stage new; cancel preserves old |

## Location preference

Versioned, Zod-validated record in `localStorage` under `qarib:location-preference`:

```ts
type LocationPreferenceV1 =
  | { version: 1; mode: 'gps'; savedAt: string; coordinates: { lat: number; lng: number } }
  | { version: 1; mode: 'manual'; savedAt: string; province: { id: string; name: string }; city: { id: string; name: string } };
```

The legacy `qarib:location:center` key is removed on first initialisation without
migration.

## Query XOR

Location-dependent API calls use a discriminated union — mixed inputs are
rejected at query construction:

| Mode | Events | Places |
|---|---|---|
| GPS | `lat`, `lng`, `radius_km` (10/15/25/40/60) | `near_lat`, `near_lng`, `radius_km` |
| Manual | `region_id` | `region_id` |

Radius controls are disabled in manual mode. Manual search follows city/kabupaten
boundaries.

## Timezone

Browser/client timezone is authoritative for all calendar date boundaries. SSR
never derives "today" from the server host. Date boundaries use explicit-offset
RFC3339 (`2026-05-15T00:00:00+07:00`, never `Z`).

## Privacy

- Cookies contain only `qarib_location_complete=v1` — no coordinates or region details.
- Qarib Web intentionally persists location only in client localStorage.
- GPS coordinates travel in public read query parameters for nearby discovery;
  infrastructure (reverse proxies, CDN, logs) may retain request URLs per their
  configured policies.
- Do not claim zero retention. Product copy acknowledges client-only application
  storage while noting infrastructure URL processing.

## Settings

Settings control is present in every app header (home and back modes). Opens as a
bottom sheet on mobile and a centered modal on desktop. Shows current location
summary and a "Ganti lokasi" link to `/lokasi`. No delete action, no language
controls in v1.

## Map Center Marker

In manual location mode (when client-side geolocation/GPS is not active), `MapView` renders a custom region center marker at the coordinates of the selected region/city. This marker is a 20px orange circle with a white border and a subtle pulsing ring animation. It acts as a clear reference anchor showing the center of the user's manual search scope and is hidden dynamically when GPS mode is active to prevent overlapping with the blue user location dot.
