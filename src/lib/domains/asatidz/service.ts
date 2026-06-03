/**
 * Asatidz domain — service layer.
 *
 * The only module in this domain that calls `api()`. All upstream asatidz
 * requests go through these functions.
 *
 * Conformance:
 *   - rule .claude/rules/api-contract.md   (no hand-rolled fetch; all via api())
 *   - rule .claude/rules/architecture.md   (service.ts in domains/asatidz/)
 */
import { api, type ApiCallOptions } from '$core/api';
import type { AsatidzResponse } from './schema.js';

export interface GetByIdArgs {
	id: string;
	expand?: string;
}

/**
 * Single asatidz by UUID.
 * Returns whatever `api()` unwraps from `envelope.data` — may be `undefined`
 * if the generated type marks the field optional.
 */
export async function fetchAsatidzById(
	args: GetByIdArgs,
	opts?: ApiCallOptions
): Promise<AsatidzResponse | undefined> {
	return api('asatidz.get', args, undefined, opts);
}
