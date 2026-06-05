// See https://svelte.dev/docs/kit/types#app.d.ts for these interfaces.

/**
 * App-level type declarations.
 *
 * Conformance:
 *   - rule .claude/rules/observability.md (requestId on locals)
 *   - rule .claude/rules/i18n.md (locale resolved server-side)
 *   - ADR 0009 (no end-user auth; no session on locals)
 */

declare global {
	namespace App {
		/** Sanitized error returned from `handleError` and rendered by `+error.svelte`. */
		interface Error {
			message: string;
			code: string;
			requestId?: string;
		}

		interface Locals {
			/** Per-request id, generated in hooks.server.ts. Echoed as `x-request-id`. */
			requestId: string;
			/** Locale resolved by Paraglide for this request. */
			locale: string;
		}

		interface PageData {
			meta?: {
				title?: string;
				description?: string;
			};
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
