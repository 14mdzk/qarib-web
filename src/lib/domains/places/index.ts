/**
 * Places domain — public barrel.
 *
 * Routes and components import from this index, not from deep paths.
 *
 * Conformance: rule .claude/rules/architecture.md (barrel in domains/<name>/index.ts)
 */
export type { PlaceResponse } from './schema.js';

export { fetchPlaceById } from './service.js';
export type { GetByIdArgs } from './service.js';

export { placeKeys, definePlaceByIdQuery } from './queries.js';
