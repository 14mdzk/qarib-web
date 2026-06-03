/**
 * Places domain — schema and types.
 *
 * Re-exports the generated PlaceResponse type. No Zod parser needed here
 * because the upstream contract is trusted (codegen is the boundary).
 *
 * Conformance:
 *   - rule .claude/rules/architecture.md   (schema.ts in domains/<name>/)
 *   - rule .claude/rules/api-contract.md   (Zod at trust boundaries only)
 */
import type { components } from '$generated/upstream';

export type PlaceResponse = components['schemas']['PlaceResponse'];
