/**
 * Handler-level tests for the tile proxy GET route.
 *
 * Tests the 400 negative path: a malformed `params.tile` must cause the
 * handler to throw an HttpError with status 400 before any upstream fetch
 * is attempted (testing.md — at least one negative path at the handler level).
 *
 * Co-located under src/lib/server/ (not inside src/routes/) because SvelteKit
 * reserves the `+` prefix for framework files and will error on `+server.test.ts`
 * inside the routes tree.
 *
 * Strategy: vi.mock the server-only modules that have SvelteKit virtual imports
 * ($env/static/private) so the handler can be imported in the Vitest node
 * environment. The happy-path and upstream-error paths are covered by the
 * tile-proxy.ts unit tests and build-time integration.
 */
import { describe, it, expect, vi } from 'vitest';

// Mock server-only modules BEFORE importing the handler.
// $core/config/index.server reads $env/static/private at module scope —
// mocking prevents the virtual-module resolution error in the Vitest node env.
vi.mock('$core/config/index.server', () => ({
	serverConfig: {
		STADIA_API_KEY: 'test-key-for-handler-test',
		UPSTREAM_API_URL: 'https://upstream.test'
	}
}));

// Suppress logger side-effects in tests.
vi.mock('$core/logger/pino.server', () => ({
	serverLogger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }
}));

// Import the handler AFTER mocks are registered (top-level await, Vitest ESM).
const { GET } = await import('../../routes/api/tiles/[...tile]/+server.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build the minimal subset of a SvelteKit RequestEvent that the tile handler
 * actually reads: `params.tile` and `locals.requestId`.
 */
function makeEvent(tile: string): Parameters<typeof GET>[0] {
	return {
		params: { tile },
		locals: { requestId: 'test-req-id' },
		request: new Request('http://localhost/api/tiles/' + tile),
		url: new URL('http://localhost/api/tiles/' + tile),
		cookies: {} as Parameters<typeof GET>[0]['cookies'],
		fetch: globalThis.fetch,
		getClientAddress: () => '127.0.0.1',
		platform: undefined,
		route: { id: '/api/tiles/[...tile]' },
		setHeaders: () => {},
		isDataRequest: false,
		isSubRequest: false,
		depends: () => {},
		untrack: (fn: () => unknown) => fn()
	} as unknown as Parameters<typeof GET>[0];
}

// ---------------------------------------------------------------------------
// Negative path: malformed tile param → 400
// ---------------------------------------------------------------------------

describe('GET /api/tiles/[...tile] — 400 on malformed tile path', () => {
	it('throws HttpError 400 for a path traversal attempt ("../evil")', async () => {
		await expect(GET(makeEvent('../evil'))).rejects.toMatchObject({ status: 400 });
	});

	it('throws HttpError 400 for non-numeric path segments ("a/b/c.png")', async () => {
		await expect(GET(makeEvent('a/b/c.png'))).rejects.toMatchObject({ status: 400 });
	});

	it('throws HttpError 400 for an empty tile param', async () => {
		await expect(GET(makeEvent(''))).rejects.toMatchObject({ status: 400 });
	});

	it('throws HttpError 400 for a path missing the .png extension', async () => {
		await expect(GET(makeEvent('12/3456/1890'))).rejects.toMatchObject({ status: 400 });
	});

	it('throws HttpError 400 when z is out of range (z=99)', async () => {
		await expect(GET(makeEvent('99/0/0.png'))).rejects.toMatchObject({ status: 400 });
	});
});
