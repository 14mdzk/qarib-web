/**
 * Stadia Maps tile proxy helpers — unit-testable, no SvelteKit routing.
 *
 * The tile proxy injects the `STADIA_API_KEY` server-side so it never reaches
 * the client bundle. Tiles are served under a long Cache-Control so repeated
 * requests for the same z/x/y are served from browser/CDN cache, mitigating
 * the per-request Node hop introduced by the BFF (ADR 0013).
 *
 * Conformance:
 *   - ADR 0013 (tile proxy; key server-side only)
 *   - .claude/rules/security.md (secrets server-only; no leakage to client)
 */

/** Stadia tile style — warm palette to match the landing aesthetic. */
const STADIA_STYLE = 'alidade_smooth';

/** Tile-proxy cache TTL: 24 h, immutable (tiles are content-addressed by z/x/y). */
const TILE_CACHE_CONTROL = 'public, max-age=86400, immutable';

/**
 * Response headers that must be stripped before forwarding the tile to the
 * browser. These are server-to-server transport artefacts (e.g. the upstream
 * server's internal headers) or could leak information about the tile provider
 * configuration.
 */
const STRIP_RESPONSE_HEADERS = new Set([
	'set-cookie',
	'x-powered-by',
	'server',
	'via',
	'x-cache',
	'x-cache-hits',
	'x-served-by',
	'x-timer',
	'x-fastly-request-id'
]);

export interface TileParams {
	z: number;
	x: number;
	y: number;
	/** True when the @2x (HiDPI / retina) variant was requested. */
	retina: boolean;
}

/**
 * Build the Stadia Maps upstream URL for the given tile coordinates.
 * The API key is appended as a query parameter (Stadia's auth mechanism).
 * The key MUST NOT appear in any response header or body sent to the browser.
 */
export function buildStadiaUrl(params: TileParams, apiKey: string): string {
	const { z, x, y, retina } = params;
	const retinaInfix = retina ? '@2x' : '';
	return `https://tiles.stadiamaps.com/tiles/${STADIA_STYLE}/${z}/${x}/${y}${retinaInfix}.png?api_key=${apiKey}`;
}

/**
 * Build the proxied tile Response from the upstream Stadia response.
 * Sets a long Cache-Control and strips any response headers that must not reach
 * the browser (including the upstream Set-Cookie and internal headers).
 * The API key is never forwarded.
 */
export function buildTileResponse(upstream: Response): Response {
	const headers = new Headers();

	for (const [key, value] of upstream.headers.entries()) {
		if (!STRIP_RESPONSE_HEADERS.has(key.toLowerCase())) {
			headers.set(key, value);
		}
	}

	// Enforce our own Cache-Control regardless of what Stadia sends.
	headers.set('cache-control', TILE_CACHE_CONTROL);

	return new Response(upstream.body, {
		status: upstream.status,
		statusText: upstream.statusText,
		headers
	});
}

/**
 * Parse a tile path string (e.g. "12/3456/1890.png" or "12/3456/1890@2x.png")
 * into `TileParams`. Returns `null` when the path is malformed, z/x/y are
 * non-integers, or x/y exceed `2**z - 1` (tile-grid upper bound).
 *
 * The x/y upper bound prevents amplification: without it, arbitrarily large
 * values would pass the regex and each occupy a 10 s timeout slot.
 */
export function parseTilePath(tilePath: string): TileParams | null {
	// Strip leading slash if present (SvelteKit catch-all can include it).
	const clean = tilePath.replace(/^\/+/, '');

	// Match "z/x/y.png" and "z/x/y@2x.png"
	const match = clean.match(/^(\d+)\/(\d+)\/(\d+)(@2x)?\.png$/);
	if (!match) return null;

	const z = parseInt(match[1], 10);
	const x = parseInt(match[2], 10);
	const y = parseInt(match[3], 10);
	const retina = match[4] === '@2x';

	// Sanity bounds: z 0–22; x/y in [0, 2**z - 1].
	// Without the upper bound, huge valid-regex coords pass the regex and occupy
	// a 10 s timeout slot each, enabling amplification DoS.
	const maxCoord = 2 ** z - 1;
	if (z < 0 || z > 22 || x < 0 || y < 0 || x > maxCoord || y > maxCoord) return null;

	return { z, x, y, retina };
}
