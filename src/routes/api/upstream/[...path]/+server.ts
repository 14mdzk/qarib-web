/**
 * BFF proxy: public read-through — all upstream GET calls go through here.
 *
 * This endpoint is the single outbound gate for upstream requests. It:
 *   1. Builds the downstream URL from serverConfig.UPSTREAM_API_URL + path + query string.
 *   2. Strips browser-sensitive headers (cookie, host, origin) via buildProxyRequest.
 *   3. Forwards x-request-id from locals for log correlation.
 *   4. Enforces a 30s timeout via AbortSignal.
 *   5. Strips Set-Cookie from the upstream response via buildProxyResponse.
 *
 * No Authorization header is injected — this is a public read-through proxy.
 * No CSRF validation — only GET is exposed.
 *
 * The request/response building logic lives in `src/lib/server/bff-proxy.ts`
 * so it can be unit-tested independently (SvelteKit forbids non-handler exports
 * from +server.ts files).
 *
 * Conformance:
 *   - ADR 0009 (no end-user auth; public API)
 *   - ADR 0012 (BFF is a public read-through proxy; no Bearer/CSRF)
 *   - rule .claude/rules/security.md (header stripping)
 *   - rule .claude/rules/observability.md (x-request-id propagated)
 *   - rule .claude/rules/api-contract.md (all upstream calls through BFF)
 */
import { error, type RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$core/config/index.server';
import { serverLogger } from '$core/logger/pino.server';
import { buildProxyRequest, buildProxyResponse } from '$server/bff-proxy';

const UPSTREAM_TIMEOUT_MS = 30_000;

export const GET: RequestHandler = async ({ params, request, locals }) => {
	const path = params.path ?? '';
	const requestId = locals.requestId;
	// Query-string passthrough: the `?` extraction here is e2e-covered in Phase C.
	const upstreamUrl = `${serverConfig.UPSTREAM_API_URL}/${path}${new URL(request.url).search}`;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

	let upstream: Response;
	try {
		upstream = await fetch(
			buildProxyRequest({
				upstreamUrl,
				originalRequest: request,
				requestId,
				signal: controller.signal
			})
		);
	} catch (cause) {
		const aborted = cause instanceof Error && cause.name === 'AbortError';
		serverLogger.error(
			{ requestId, path, err: String(cause) },
			aborted ? 'bff: upstream timeout' : 'bff: upstream error'
		);
		throw error(aborted ? 504 : 502, {
			message: aborted ? 'Upstream timeout' : 'Upstream unavailable',
			code: aborted ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_ERROR'
		});
	} finally {
		clearTimeout(timeout);
	}
	return buildProxyResponse(upstream);
};
