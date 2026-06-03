/**
 * Places domain — service layer.
 *
 * The only module in this domain that calls `api()`. All upstream place
 * requests go through these functions.
 *
 * Conformance:
 *   - rule .claude/rules/api-contract.md   (no hand-rolled fetch; all via api())
 *   - rule .claude/rules/architecture.md   (service.ts in domains/places/)
 */
import { api, type ApiCallOptions } from '$core/api';
import type { PlaceResponse } from './schema.js';

export interface GetByIdArgs {
	id: string;
	expand?: string;
}

/**
 * Single place by UUID.
 * Returns whatever `api()` unwraps from `envelope.data` — may be `undefined`
 * if the generated type marks the field optional.
 */
export async function fetchPlaceById(
	args: GetByIdArgs,
	opts?: ApiCallOptions
): Promise<PlaceResponse | undefined> {
	return api('places.get', args, undefined, opts);
}
