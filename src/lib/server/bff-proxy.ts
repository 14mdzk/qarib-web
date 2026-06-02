/**
 * BFF proxy helpers — public read-through.
 *
 * The Qarib web app has no end-user auth (ADR 0009). The BFF is a public
 * read-through proxy that forwards safe, allow-listed headers to the upstream
 * API and never injects an Authorization token (ADR 0012).
 *
 * Extracted from `routes/api/upstream/[...path]/+server.ts` so they can be
 * unit-tested without SvelteKit routing, and so the route file only exports
 * the HTTP method handlers that SvelteKit allows.
 *
 * Conformance:
 *   - ADR 0009 (no end-user auth; public API)
 *   - ADR 0012 (BFF is a public read-through proxy; no Bearer)
 *   - rule .claude/rules/security.md (header stripping; no cookies, host, origin forwarded)
 *   - rule .claude/rules/observability.md (x-request-id propagated for log correlation)
 */

/**
 * Headers to forward from the browser request to upstream.
 * Anything not in this set is dropped to prevent header injection and
 * to avoid forwarding session cookies to the upstream (rule security.md).
 */
const ALLOWED_REQUEST_HEADERS = new Set([
	'accept',
	'content-type',
	'accept-language',
	'accept-encoding'
]);

/**
 * Build the upstream Request, stripping browser-sensitive headers.
 * No Authorization header is injected — this is a public read-through proxy
 * per ADR 0009 and ADR 0012.
 */
export function buildProxyRequest(params: {
	upstreamUrl: string;
	originalRequest: Request;
	requestId: string;
	signal: AbortSignal;
}): Request {
	const { upstreamUrl, originalRequest, requestId, signal } = params;

	const headers = new Headers();

	// Forward only the allow-listed subset; strip cookie, host, origin, x-csrf, etc.
	for (const [key, value] of originalRequest.headers.entries()) {
		if (ALLOWED_REQUEST_HEADERS.has(key.toLowerCase())) {
			headers.set(key, value);
		}
	}

	// Forward request id for log correlation across services (rule observability.md)
	headers.set('x-request-id', requestId);

	return new Request(upstreamUrl, { method: 'GET', headers, signal });
}

/**
 * Strip headers from the upstream response that must not reach the browser.
 * `set-cookie` is stripped because the BFF must not leak upstream session state.
 *
 * When the upstream Content-Type is `text/event-stream`, anti-buffering headers
 * are added so the stream is not collapsed by intermediate proxies (nginx,
 * Cloudflare, etc.) before it reaches the browser:
 *   - `Cache-Control: no-cache, no-transform` — disables all proxy caching and
 *     content transformation that would buffer the response.
 *   - `X-Accel-Buffering: no` — nginx-specific flag; instructs nginx not to
 *     buffer the response body even when proxy_buffering is on globally.
 *   - `Connection: keep-alive` — keeps the underlying TCP connection alive
 *     across the proxy boundary so the stream is not torn down prematurely.
 *
 * Conformance:
 *   - rule .claude/rules/realtime.md (SSE through BFF)
 *   - rule .claude/rules/security.md (no upstream cookies forwarded to browser)
 */
export function buildProxyResponse(upstreamResponse: Response): Response {
	const headers = new Headers(upstreamResponse.headers);
	headers.delete('set-cookie');

	const contentType = upstreamResponse.headers.get('content-type') ?? '';
	if (contentType.startsWith('text/event-stream')) {
		headers.set('cache-control', 'no-cache, no-transform');
		headers.set('x-accel-buffering', 'no');
		headers.set('connection', 'keep-alive');
	}

	return new Response(upstreamResponse.body, {
		status: upstreamResponse.status,
		statusText: upstreamResponse.statusText,
		headers
	});
}
