/**
 * Server hooks.
 *
 * Stack (in execution order):
 *   1. requestIdHandle    — generate per-request id, attach to locals, echo header.
 *   2. paraglideHandle    — locale resolution + AsyncLocalStorage for messages.
 *   3. securityHandle     — apply non-CSP security headers (last so it sees the final response).
 *
 * CSP is now owned by `svelte.config.js kit.csp` (mode: 'auto') so SvelteKit
 * can nonce its own inline bootstrap script on every request. Manually setting
 * Content-Security-Policy here would override the nonce-bearing header that
 * SvelteKit emits, re-breaking hydration. See ADR 0014.
 *
 * Conformance:
 *   - rule .claude/rules/observability.md  (request id minted here, echoed downstream)
 *   - rule .claude/rules/security.md       (Referrer-Policy, X-Content-Type-Options, …; CSP → kit.csp)
 *   - rule .claude/rules/i18n.md           (locale comes from cookie, defaults to `en`)
 *   - ADR 0009                             (no end-user auth; no session handle)
 *   - ADR 0012                             (BFF is a public read-through proxy)
 *   - ADR 0014                             (CSP via SvelteKit nonces)
 */
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle, HandleServerError } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { paraglideMiddleware } from '$lib/generated/paraglide/server.js';
import { serverLogger } from '$core/logger/pino.server';

const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Generate a per-request id and propagate it via `locals.requestId` and the
 * outbound `x-request-id` response header. Honors an inbound id when one is
 * provided by an upstream proxy.
 */
const requestIdHandle: Handle = async ({ event, resolve }) => {
	const inbound = event.request.headers.get(REQUEST_ID_HEADER);
	const requestId = inbound && inbound.length <= 128 ? inbound : crypto.randomUUID();
	event.locals.requestId = requestId;

	const response = await resolve(event);
	response.headers.set(REQUEST_ID_HEADER, requestId);
	return response;
};

/**
 * Bridge Paraglide's request-scoped locale + AsyncLocalStorage into the
 * SvelteKit hook chain.
 */
const paraglideHandle: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;
		event.locals.locale = locale;
		return resolve(event);
	});

/**
 * Apply non-CSP security headers.
 *
 * Content-Security-Policy is intentionally absent here: it is emitted by
 * SvelteKit's `kit.csp` (svelte.config.js) which adds a per-request nonce to
 * every inline `<script>` tag it generates. Overriding that header here would
 * drop the nonce and re-break hydration (ADR 0014).
 */
const securityHandle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	if (!dev) {
		response.headers.set(
			'Strict-Transport-Security',
			'max-age=31536000; includeSubDomains; preload'
		);
	}
	return response;
};

export const handle = sequence(requestIdHandle, paraglideHandle, securityHandle);

/**
 * Server-side error hook. Logs the full error with request id and returns a
 * sanitized payload that `+error.svelte` can render.
 */
export const handleError: HandleServerError = ({ error, event, status, message }) => {
	const requestId = event.locals.requestId;
	const err =
		error instanceof Error
			? { name: error.name, message: error.message, stack: error.stack }
			: { value: String(error) };
	serverLogger.error(
		{ requestId, status, route: event.url.pathname, err },
		'unhandled server error'
	);
	return {
		message: status >= 500 ? 'Internal error' : message,
		code: status >= 500 ? 'INTERNAL' : 'CLIENT_ERROR',
		requestId
	};
};
