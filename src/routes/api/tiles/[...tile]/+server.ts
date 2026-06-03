/**
 * BFF tile proxy: Stadia Maps raster tiles for the Leaflet MapView.
 *
 * This endpoint:
 *   1. Parses z/x/y (with optional @2x retina suffix) from the catch-all param.
 *   2. Validates that z, x, y are non-negative integers (z ≤ 22, x/y ≤ 2**z-1) — 400 on failure.
 *   3. Fetches the tile from Stadia Maps, injecting STADIA_API_KEY server-side.
 *   4. Guards upstream.ok — non-2xx responses become 502 rather than streaming error bodies.
 *   5. Returns the image with a long Cache-Control (tiles are immutable per z/x/y).
 *   6. On upstream failure or timeout, returns 502/504.
 *
 * The API key never appears in any client-visible response header or body.
 *
 * Leaflet is configured to call `/api/tiles/{z}/{x}/{y}{r}.png` with `detectRetina:
 * true`, so Leaflet appends `@2x` automatically on HiDPI screens.
 *
 * Conformance:
 *   - ADR 0013 (tile proxy; key server-side only)
 *   - .claude/rules/security.md (key never forwarded to client)
 */
import { error, type RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$core/config/index.server';
import { serverLogger } from '$core/logger/pino.server';
import { parseTilePath, buildStadiaUrl, buildTileResponse } from '$server/tile-proxy';

const TILE_TIMEOUT_MS = 10_000;

// TODO(lead): add per-IP token-bucket rate limit before production traffic

export const GET: RequestHandler = async ({ params, locals }) => {
	const tilePath = params.tile ?? '';
	const requestId = locals.requestId;

	const tileParams = parseTilePath(tilePath);
	if (!tileParams) {
		throw error(400, { message: 'Invalid tile path', code: 'INVALID_TILE_PATH' });
	}

	const stadiaUrl = buildStadiaUrl(tileParams, serverConfig.STADIA_API_KEY);
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TILE_TIMEOUT_MS);

	let upstream: Response;
	try {
		upstream = await fetch(stadiaUrl, {
			method: 'GET',
			headers: { accept: 'image/png' },
			signal: controller.signal
		});
	} catch (cause) {
		const aborted = cause instanceof Error && cause.name === 'AbortError';
		serverLogger.error(
			{ requestId, tile: tilePath, err: String(cause) },
			aborted ? 'tile-proxy: upstream timeout' : 'tile-proxy: upstream error'
		);
		throw error(aborted ? 504 : 502, {
			message: aborted ? 'Tile upstream timeout' : 'Tile upstream unavailable',
			code: aborted ? 'TILE_TIMEOUT' : 'TILE_ERROR'
		});
	} finally {
		clearTimeout(timeout);
	}

	// Only stream 2xx tiles. Non-2xx (e.g. 404 from Stadia for invalid coords)
	// must not be forwarded verbatim — doing so leaks Stadia error bodies and
	// caches bad responses client-side.
	if (!upstream.ok) {
		serverLogger.warn(
			{ requestId, tile: tilePath, status: upstream.status },
			'tile-proxy: upstream non-2xx'
		);
		throw error(502, { message: 'Tile upstream error', code: 'TILE_UPSTREAM_ERROR' });
	}

	return buildTileResponse(upstream);
};
