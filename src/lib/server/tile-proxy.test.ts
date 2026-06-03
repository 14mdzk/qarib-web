/**
 * Unit tests for the Stadia tile proxy helpers.
 *
 * Validates: URL construction with key, retina handling, cache header, key
 * not leaked into response, path parsing, and malformed-path rejection.
 */
import { describe, it, expect } from 'vitest';
import { buildStadiaUrl, buildTileResponse, parseTilePath } from '$server/tile-proxy.js';

const FAKE_KEY = 'test-api-key-1234';

// ---------------------------------------------------------------------------
// buildStadiaUrl
// ---------------------------------------------------------------------------

describe('buildStadiaUrl', () => {
	it('builds the correct Stadia URL for a standard tile', () => {
		const url = buildStadiaUrl({ z: 12, x: 3456, y: 1890, retina: false }, FAKE_KEY);
		expect(url).toBe(
			`https://tiles.stadiamaps.com/tiles/alidade_smooth/12/3456/1890.png?api_key=${FAKE_KEY}`
		);
	});

	it('appends @2x infix for retina tiles', () => {
		const url = buildStadiaUrl({ z: 10, x: 500, y: 600, retina: true }, FAKE_KEY);
		expect(url).toContain('/500/600@2x.png');
	});

	it('omits @2x infix when retina is false', () => {
		const url = buildStadiaUrl({ z: 10, x: 500, y: 600, retina: false }, FAKE_KEY);
		expect(url).not.toContain('@2x');
		expect(url).toContain('/500/600.png');
	});

	it('includes the api_key query parameter', () => {
		const url = buildStadiaUrl({ z: 5, x: 10, y: 20, retina: false }, FAKE_KEY);
		expect(url).toContain(`api_key=${FAKE_KEY}`);
	});

	it('uses the alidade_smooth style', () => {
		const url = buildStadiaUrl({ z: 5, x: 10, y: 20, retina: false }, FAKE_KEY);
		expect(url).toContain('/tiles/alidade_smooth/');
	});
});

// ---------------------------------------------------------------------------
// buildTileResponse — cache-control + header stripping
// ---------------------------------------------------------------------------

function makeStadiaResponse(status: number, extraHeaders: Record<string, string> = {}): Response {
	const headers = new Headers({
		'content-type': 'image/png',
		'content-length': '1024',
		...extraHeaders
	});
	return new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), { status, headers });
}

describe('buildTileResponse', () => {
	it('sets Cache-Control to the long immutable value', () => {
		const upstream = makeStadiaResponse(200);
		const res = buildTileResponse(upstream);
		expect(res.headers.get('cache-control')).toBe('public, max-age=86400, immutable');
	});

	it('overrides any Cache-Control from upstream', () => {
		const upstream = makeStadiaResponse(200, { 'cache-control': 'no-store' });
		const res = buildTileResponse(upstream);
		expect(res.headers.get('cache-control')).toBe('public, max-age=86400, immutable');
	});

	it('preserves content-type', () => {
		const upstream = makeStadiaResponse(200);
		const res = buildTileResponse(upstream);
		expect(res.headers.get('content-type')).toBe('image/png');
	});

	it('preserves the upstream status code', () => {
		const upstream = makeStadiaResponse(404);
		const res = buildTileResponse(upstream);
		expect(res.status).toBe(404);
	});

	it('strips set-cookie', () => {
		const upstream = makeStadiaResponse(200, { 'set-cookie': 'sid=secret; HttpOnly' });
		const res = buildTileResponse(upstream);
		expect(res.headers.get('set-cookie')).toBeNull();
	});

	it('strips x-powered-by', () => {
		const upstream = makeStadiaResponse(200, { 'x-powered-by': 'Express' });
		const res = buildTileResponse(upstream);
		expect(res.headers.get('x-powered-by')).toBeNull();
	});

	it('strips server header', () => {
		const upstream = makeStadiaResponse(200, { server: 'nginx/1.21' });
		const res = buildTileResponse(upstream);
		expect(res.headers.get('server')).toBeNull();
	});

	it('does not introduce the API key into response headers (buildTileResponse never injects it)', () => {
		// buildTileResponse only re-assembles headers from the upstream response.
		// The API key is only ever used in buildStadiaUrl (outbound URL); it must
		// not appear in any header that buildTileResponse sets on its own.
		const upstream = makeStadiaResponse(200);
		const res = buildTileResponse(upstream);
		const allValues = Array.from(res.headers.values()).join(' ');
		expect(allValues).not.toContain(FAKE_KEY);
	});
});

// ---------------------------------------------------------------------------
// parseTilePath
// ---------------------------------------------------------------------------

describe('parseTilePath', () => {
	it('parses a standard z/x/y.png path', () => {
		expect(parseTilePath('12/3456/1890.png')).toEqual({ z: 12, x: 3456, y: 1890, retina: false });
	});

	it('parses a retina z/x/y@2x.png path', () => {
		expect(parseTilePath('10/500/600@2x.png')).toEqual({ z: 10, x: 500, y: 600, retina: true });
	});

	it('handles a leading slash', () => {
		expect(parseTilePath('/8/100/200.png')).toEqual({ z: 8, x: 100, y: 200, retina: false });
	});

	it('returns null for a path without .png extension', () => {
		expect(parseTilePath('12/3456/1890')).toBeNull();
	});

	it('returns null for a path with non-integer segments', () => {
		expect(parseTilePath('z/x/y.png')).toBeNull();
	});

	it('returns null for a path with too few segments', () => {
		expect(parseTilePath('12/3456.png')).toBeNull();
	});

	it('returns null for an empty string', () => {
		expect(parseTilePath('')).toBeNull();
	});

	it('returns null for z > 22', () => {
		expect(parseTilePath('23/0/0.png')).toBeNull();
	});

	it('accepts z === 0', () => {
		expect(parseTilePath('0/0/0.png')).toEqual({ z: 0, x: 0, y: 0, retina: false });
	});

	it('accepts z === 22', () => {
		expect(parseTilePath('22/0/0.png')).toEqual({ z: 22, x: 0, y: 0, retina: false });
	});

	// x/y upper-bound (amplification guard)
	it('rejects x > 2**z - 1 (out-of-grid amplification guard)', () => {
		// At z=10, max coord is 2**10 - 1 = 1023.
		expect(parseTilePath('10/1024/0.png')).toBeNull();
	});

	it('rejects y > 2**z - 1', () => {
		expect(parseTilePath('10/0/1024.png')).toBeNull();
	});

	it('accepts x === 2**z - 1 (inclusive upper boundary)', () => {
		// z=10 → max = 1023
		expect(parseTilePath('10/1023/0.png')).toEqual({ z: 10, x: 1023, y: 0, retina: false });
	});

	it('rejects x at z=0 > 0 (z=0 has exactly one tile: 0/0)', () => {
		expect(parseTilePath('0/1/0.png')).toBeNull();
	});
});
