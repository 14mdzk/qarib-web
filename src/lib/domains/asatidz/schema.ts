/**
 * Asatidz domain — schema and types.
 *
 * Re-exports the generated AsatidzResponse type. No Zod parser needed here
 * because the upstream contract is trusted (codegen is the boundary).
 *
 * Schema audit (AsatidzResponse fields available):
 *   - id, slug, name (L10nString), alias_name (L10nString|null)
 *   - gender (1=Male, 2=Female), description (L10nString|null)
 *   - is_active, created_at, updated_at
 *
 * Fields from the v2 UstadzDetail spec NOT present in the schema:
 *   - bio/long-form text  → use description (L10nString|null) as bio substitute
 *   - specializations     → NOT in schema; spec-pill section omitted gracefully
 *   - location/city       → NOT in schema; location sub-line omitted gracefully
 *
 * Conformance:
 *   - rule .claude/rules/architecture.md   (schema.ts in domains/<name>/)
 *   - rule .claude/rules/api-contract.md   (Zod at trust boundaries only)
 */
import type { components } from '$generated/upstream';

export type AsatidzResponse = components['schemas']['AsatidzResponse'];
