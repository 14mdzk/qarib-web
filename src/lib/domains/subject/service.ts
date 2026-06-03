/**
 * Subject domain — service layer.
 *
 * The only module in this domain that calls `api()`. All upstream subject
 * requests go through these functions.
 *
 * Conformance:
 *   - rule .claude/rules/api-contract.md   (no hand-rolled fetch; all via api())
 *   - rule .claude/rules/architecture.md   (service.ts in domains/subject/)
 */
import { api, type ApiCallOptions } from '$core/api';
import type { SubjectResponse } from './schema.js';

export interface GetByIdArgs {
	id: string;
	expand?: string;
}

/**
 * Single subject by UUID.
 * Returns whatever `api()` unwraps from `envelope.data` — may be `undefined`
 * if the generated type marks the field optional.
 */
export async function fetchSubjectById(
	args: GetByIdArgs,
	opts?: ApiCallOptions
): Promise<SubjectResponse | undefined> {
	return api('subject.get', args, undefined, opts);
}
