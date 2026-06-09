/**
 * Regions domain — type re-exports and trust-boundary parsers.
 *
 * Region IDs are opaque strings (numeric codes in practice, not UUIDs).
 * `location_tz` is deliberately ignored for calendar authority — the
 * browser timezone is always authoritative per the locked product decision
 * in docs/plans/location-onboarding-settings.md § "Timezone authority".
 *
 * Conformance:
 *   - rule .claude/rules/api-contract.md
 *   - rule .claude/rules/architecture.md
 */
export type { components } from '$generated/upstream';

/** Shorthand for a single administrative region. */
export type RegionResponse = import('$generated/upstream').components['schemas']['RegionResponse'];
