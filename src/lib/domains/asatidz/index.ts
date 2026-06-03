/**
 * Asatidz domain — public barrel.
 *
 * Routes and components import from this index, not from deep paths.
 *
 * Conformance: rule .claude/rules/architecture.md (barrel in domains/<name>/index.ts)
 */
export type { AsatidzResponse } from './schema.js';

export { fetchAsatidzById } from './service.js';
export type { GetByIdArgs } from './service.js';

export { asatidzKeys, defineAsatidzByIdQuery } from './queries.js';
