/**
 * Unit tests for the BFF proxy's `buildProxyRequest` and `buildProxyResponse`
 * pure functions.
 *
 * Tests the header stripping, request-id forwarding, and SSE anti-buffering
 * header injection logic in isolation — no SvelteKit routing involved.
 *
 * The BFF is a public read-through proxy (ADR 0009 / ADR 0012): no Bearer
 * token is injected, no auth state is needed.
 */
import { describe, it, expect } from 'vitest';
import { buildProxyRequest, buildProxyResponse } from '$server/bff-proxy.js';

const ABORT_SIGNAL = new AbortController().signal;

// ---------------------------------------------------------------------------
// buildProxyRequest — public read-through (no Authorization)
// ---------------------------------------------------------------------------

describe('buildProxyRequest (public read-through)', () => {
	it('forwards an allow-listed GET and injects no Authorization', () => {
		const original = new Request('http://localhost/api/upstream/events/nearby?lat=1&lng=2', {
			method: 'GET',
			headers: { accept: 'application/json', cookie: 'sid=secret', origin: 'http://evil' }
		});
		const req = buildProxyRequest({
			upstreamUrl: 'https://api.example.com/events/nearby?lat=1&lng=2',
			originalRequest: original,
			requestId: 'req-123',
			signal: new AbortController().signal
		});
		expect(req.headers.get('authorization')).toBeNull();
		expect(req.headers.get('cookie')).toBeNull();
		expect(req.headers.get('origin')).toBeNull();
		expect(req.headers.get('accept')).toBe('application/json');
		expect(req.headers.get('x-request-id')).toBe('req-123');
		expect(req.method).toBe('GET');
	});
});

// ---------------------------------------------------------------------------
// buildProxyRequest — header stripping
// ---------------------------------------------------------------------------

function makeRequest(method: string, headers: Record<string, string> = {}): Request {
	return new Request('http://browser.example.com/api/upstream/cameras', {
		method,
		headers
	});
}

describe('buildProxyRequest — header stripping', () => {
	it('strips the cookie header', () => {
		const req = makeRequest('GET', { cookie: 'sid=abc; csrf=tok' });
		const proxy = buildProxyRequest({
			upstreamUrl: 'http://upstream/cameras',
			originalRequest: req,
			requestId: 'req-1',
			signal: ABORT_SIGNAL
		});
		expect(proxy.headers.get('cookie')).toBeNull();
	});

	it('strips the host header', () => {
		const req = makeRequest('GET', { host: 'browser.example.com' });
		const proxy = buildProxyRequest({
			upstreamUrl: 'http://upstream/cameras',
			originalRequest: req,
			requestId: 'req-1',
			signal: ABORT_SIGNAL
		});
		expect(proxy.headers.get('host')).toBeNull();
	});

	it('strips the origin header', () => {
		const req = makeRequest('GET', { origin: 'https://browser.example.com' });
		const proxy = buildProxyRequest({
			upstreamUrl: 'http://upstream/cameras',
			originalRequest: req,
			requestId: 'req-1',
			signal: ABORT_SIGNAL
		});
		expect(proxy.headers.get('origin')).toBeNull();
	});

	it('strips x-csrf header (not in allow-list)', () => {
		const req = makeRequest('GET', { 'x-csrf': 'tok123' });
		const proxy = buildProxyRequest({
			upstreamUrl: 'http://upstream/cameras',
			originalRequest: req,
			requestId: 'req-1',
			signal: ABORT_SIGNAL
		});
		expect(proxy.headers.get('x-csrf')).toBeNull();
	});

	it('forwards content-type', () => {
		const req = makeRequest('GET', { 'content-type': 'application/json' });
		const proxy = buildProxyRequest({
			upstreamUrl: 'http://upstream/cameras',
			originalRequest: req,
			requestId: 'req-1',
			signal: ABORT_SIGNAL
		});
		expect(proxy.headers.get('content-type')).toBe('application/json');
	});

	it('forwards accept header', () => {
		const req = makeRequest('GET', { accept: 'application/json' });
		const proxy = buildProxyRequest({
			upstreamUrl: 'http://upstream/cameras',
			originalRequest: req,
			requestId: 'req-1',
			signal: ABORT_SIGNAL
		});
		expect(proxy.headers.get('accept')).toBe('application/json');
	});
});

// ---------------------------------------------------------------------------
// buildProxyRequest — no Authorization header ever
// ---------------------------------------------------------------------------

describe('buildProxyRequest — no Authorization', () => {
	it('never sets an Authorization header (public proxy, ADR 0009)', () => {
		const req = makeRequest('GET', { accept: 'application/json' });
		const proxy = buildProxyRequest({
			upstreamUrl: 'http://upstream/cameras',
			originalRequest: req,
			requestId: 'req-1',
			signal: ABORT_SIGNAL
		});
		expect(proxy.headers.get('authorization')).toBeNull();
		expect(proxy.headers.get('Authorization')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// buildProxyRequest — request-id propagation
// ---------------------------------------------------------------------------

describe('buildProxyRequest — request-id propagation', () => {
	it('sets x-request-id from the provided requestId', () => {
		const req = makeRequest('GET');
		const proxy = buildProxyRequest({
			upstreamUrl: 'http://upstream/cameras',
			originalRequest: req,
			requestId: 'my-trace-id',
			signal: ABORT_SIGNAL
		});
		expect(proxy.headers.get('x-request-id')).toBe('my-trace-id');
	});
});

// ---------------------------------------------------------------------------
// buildProxyRequest — URL and method
// ---------------------------------------------------------------------------

describe('buildProxyRequest — URL and method', () => {
	it('forwards the upstreamUrl unchanged', () => {
		const req = makeRequest('GET');
		const proxy = buildProxyRequest({
			upstreamUrl: 'http://upstream/cameras?search=foo',
			originalRequest: req,
			requestId: 'req-1',
			signal: ABORT_SIGNAL
		});
		expect(proxy.url).toBe('http://upstream/cameras?search=foo');
	});

	it('preserves full query string verbatim (including multiple params)', () => {
		const req = makeRequest('GET');
		const proxy = buildProxyRequest({
			upstreamUrl: 'http://upstream/cameras?a=1&b=2',
			originalRequest: req,
			requestId: 'req-1',
			signal: ABORT_SIGNAL
		});
		expect(proxy.url).toBe('http://upstream/cameras?a=1&b=2');
	});

	it('always uses GET method even when original request is POST (read-through proxy)', () => {
		const req = makeRequest('POST');
		const proxy = buildProxyRequest({
			upstreamUrl: 'http://upstream/cameras/1',
			originalRequest: req,
			requestId: 'req-1',
			signal: ABORT_SIGNAL
		});
		expect(proxy.method).toBe('GET');
	});
});

// ---------------------------------------------------------------------------
// buildProxyResponse — set-cookie stripping
// ---------------------------------------------------------------------------

function makeUpstreamResponse(
	contentType: string,
	extraHeaders: Record<string, string> = {}
): Response {
	const headers = new Headers({ 'content-type': contentType, ...extraHeaders });
	return new Response(null, { status: 200, headers });
}

describe('buildProxyResponse — set-cookie stripping', () => {
	it('strips set-cookie from the upstream response', () => {
		const upstream = makeUpstreamResponse('application/json', {
			'set-cookie': 'sid=secret; HttpOnly'
		});
		const proxy = buildProxyResponse(upstream);
		expect(proxy.headers.get('set-cookie')).toBeNull();
	});

	it('preserves content-type', () => {
		const upstream = makeUpstreamResponse('application/json');
		const proxy = buildProxyResponse(upstream);
		expect(proxy.headers.get('content-type')).toBe('application/json');
	});

	it('preserves upstream status code', () => {
		const upstream = new Response(null, {
			status: 404,
			statusText: 'Not Found',
			headers: new Headers()
		});
		const proxy = buildProxyResponse(upstream);
		expect(proxy.status).toBe(404);
	});
});

// ---------------------------------------------------------------------------
// buildProxyResponse — SSE anti-buffering headers (preserved from original)
// ---------------------------------------------------------------------------

describe('buildProxyResponse — text/event-stream anti-buffering headers', () => {
	it('adds Cache-Control: no-cache, no-transform for text/event-stream', () => {
		const upstream = makeUpstreamResponse('text/event-stream');
		const proxy = buildProxyResponse(upstream);
		expect(proxy.headers.get('cache-control')).toBe('no-cache, no-transform');
	});

	it('adds X-Accel-Buffering: no for text/event-stream', () => {
		const upstream = makeUpstreamResponse('text/event-stream');
		const proxy = buildProxyResponse(upstream);
		expect(proxy.headers.get('x-accel-buffering')).toBe('no');
	});

	it('adds Connection: keep-alive for text/event-stream', () => {
		const upstream = makeUpstreamResponse('text/event-stream');
		const proxy = buildProxyResponse(upstream);
		expect(proxy.headers.get('connection')).toBe('keep-alive');
	});

	it('handles content-type with charset suffix (text/event-stream; charset=utf-8)', () => {
		const upstream = makeUpstreamResponse('text/event-stream; charset=utf-8');
		const proxy = buildProxyResponse(upstream);
		expect(proxy.headers.get('cache-control')).toBe('no-cache, no-transform');
		expect(proxy.headers.get('x-accel-buffering')).toBe('no');
		expect(proxy.headers.get('connection')).toBe('keep-alive');
	});

	it('does NOT add anti-buffering headers for application/json', () => {
		const upstream = makeUpstreamResponse('application/json');
		const proxy = buildProxyResponse(upstream);
		expect(proxy.headers.get('cache-control')).toBeNull();
		expect(proxy.headers.get('x-accel-buffering')).toBeNull();
		expect(proxy.headers.get('connection')).toBeNull();
	});

	it('does NOT add anti-buffering headers for text/plain', () => {
		const upstream = makeUpstreamResponse('text/plain');
		const proxy = buildProxyResponse(upstream);
		expect(proxy.headers.get('cache-control')).toBeNull();
		expect(proxy.headers.get('x-accel-buffering')).toBeNull();
		expect(proxy.headers.get('connection')).toBeNull();
	});

	it('does NOT add anti-buffering headers when content-type is absent', () => {
		const upstream = new Response(null, { status: 200 });
		const proxy = buildProxyResponse(upstream);
		expect(proxy.headers.get('cache-control')).toBeNull();
		expect(proxy.headers.get('x-accel-buffering')).toBeNull();
		expect(proxy.headers.get('connection')).toBeNull();
	});

	it('still strips set-cookie from SSE responses', () => {
		const upstream = makeUpstreamResponse('text/event-stream', {
			'set-cookie': 'sid=secret; HttpOnly'
		});
		const proxy = buildProxyResponse(upstream);
		expect(proxy.headers.get('set-cookie')).toBeNull();
	});
});
