/**
 * Places domain — public barrel.
 *
 * Routes and components import from this index, not from deep paths.
 *
 * Conformance: rule .claude/rules/architecture.md (barrel in domains/<name>/index.ts)
 */
export type { PlaceResponse } from './schema.js';

export { fetchPlaceList, fetchPlaceById } from './service.js';
export type { ListPlacesArgs, GetByIdArgs } from './service.js';

export { placeKeys, definePlaceListQuery, definePlaceByIdQuery } from './queries.js';
