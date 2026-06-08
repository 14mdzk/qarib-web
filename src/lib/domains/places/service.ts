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
import { api, type ApiCallOptions, type Paginated } from '$core/api';
import type { PlaceResponse } from './schema.js';

export interface ListPlacesArgs {
	cursor?: string;
	limit?: number;
	search?: string;
	region_id?: string;
	is_active?: boolean;
	near_lat?: number;
	near_lng?: number;
	radius_km?: number;
}

export interface GetByIdArgs {
	id: string;
	expand?: string;
}

/**
 * List places (masjid), optionally near a lat/lng.
 */
export async function fetchPlaceList(
	args: ListPlacesArgs,
	opts?: ApiCallOptions
): Promise<Paginated<PlaceResponse[]>> {
	return api('places.list', args, undefined, opts);
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
