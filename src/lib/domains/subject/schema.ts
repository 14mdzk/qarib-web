/**
 * Subject domain — schema and types.
 *
 * Re-exports the generated SubjectResponse type. No Zod parser needed here
 * because the upstream contract is trusted (codegen is the boundary).
 *
 * Schema audit (SubjectResponse fields available):
 *   - id, slug, name (L10nString), description (L10nString|null)
 *   - is_active, created_at, updated_at
 *
 * Fields from the v2 SubjectDetail spec NOT present in the schema:
 *   - stat counts (kajian count, unique ustadz count, unique masjid count)
 *     → derived from the kajian list loaded at route level (see +page.svelte)
 *   - ustadz carousel data
 *     → derived from the kajian list (expand=place,asatidz) at route level
 *
 * Conformance:
 *   - rule .claude/rules/architecture.md   (schema.ts in domains/<name>/)
 *   - rule .claude/rules/api-contract.md   (Zod at trust boundaries only)
 */
import type { components } from '$generated/upstream';

export type SubjectResponse = components['schemas']['SubjectResponse'];
