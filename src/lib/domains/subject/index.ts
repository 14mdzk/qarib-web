/**
 * Subject domain — public barrel.
 *
 * Routes and components import from this index, not from deep paths.
 *
 * Conformance: rule .claude/rules/architecture.md (barrel in domains/<name>/index.ts)
 */
export type { SubjectResponse } from './schema.js';

export { fetchSubjectById } from './service.js';
export type { GetByIdArgs } from './service.js';

export { subjectKeys, defineSubjectByIdQuery } from './queries.js';
