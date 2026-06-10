/**
 * Regions domain — service layer.
 *
 * All upstream region requests go through these functions.  Cursor
 * pagination is consumed imperatively (accumulate pages while
 * `pagination.has_more`), not via TanStack infinite query, because the
 * total data set is small (~provinces + ~cities) and the consumer needs
 * the complete list to build dropdown options.
 *
 * Conformance:
 *   - rule .claude/rules/api-contract.md
 *   - rule .claude/rules/architecture.md
 *   - docs/plans/location-onboarding-settings.md § "Regions domain"
 */
import { api, type ApiCallOptions, type Paginated } from '$core/api';
import type { RegionResponse } from './schema.js';

// ---------------------------------------------------------------------------
// Args types
// ---------------------------------------------------------------------------

export interface ListRegionsArgs {
	cursor?: string;
	limit?: number;
	search?: string;
	parent?: string;
}

export interface GetRegionArgs {
	id: string;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/** Maximum regions per page (matches plan contract). */
const PAGE_LIMIT = 100;

/**
 * Fetch a single page of regions.  Callers iterating over multiple pages
 * use `accumulateRegions` below.
 */
export async function fetchRegionsPage(
	args: ListRegionsArgs,
	opts?: ApiCallOptions
): Promise<Paginated<RegionResponse[]>> {
	return api('regions.list', { limit: PAGE_LIMIT, ...args }, undefined, opts);
}

/**
 * Accumulate every region page into a single array.  Follows
 * `pagination.next_cursor` while `has_more` is true.
 */
export async function accumulateRegions(
	baseArgs: Omit<ListRegionsArgs, 'cursor'>,
	opts?: ApiCallOptions
): Promise<RegionResponse[]> {
	const items: RegionResponse[] = [];
	let cursor: string | undefined;

	do {
		const page = await fetchRegionsPage({ ...baseArgs, cursor }, opts);
		items.push(...(page.data ?? []));
		cursor = page.pagination?.has_more ? (page.pagination.next_cursor ?? undefined) : undefined;
	} while (cursor);

	return items;
}

/**
 * Fetch provinces.
 * Accumulates all pages with `limit=100`.
 */
export async function fetchProvinces(opts?: ApiCallOptions): Promise<RegionResponse[]> {
	return accumulateRegions({}, opts);
}

/**
 * Fetch cities / kabupaten that belong to a given province.
 * Accumulates all pages with `limit=100` and `parent=<provinceId>`.
 */
export async function fetchCities(
	provinceId: string,
	opts?: ApiCallOptions
): Promise<RegionResponse[]> {
	return accumulateRegions({ parent: provinceId }, opts);
}

/**
 * Single region by ID.
 */
export async function fetchRegionById(
	id: string,
	opts?: ApiCallOptions
): Promise<RegionResponse | undefined> {
	return api('regions.get', { id }, undefined, opts);
}
