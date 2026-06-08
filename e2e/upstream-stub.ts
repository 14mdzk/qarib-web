/**
 * Minimal Node HTTP stub server for the upstream backend.
 *
 * Used by global-setup.ts to start a fake upstream before Playwright launches
 * the SvelteKit preview server. Speaks the envelope format that core-fetch and
 * the auth modules expect: { success: true, data: … } / { success: false, error: … }.
 *
 * Conformance: rule .claude/rules/testing.md (e2e with stub upstream).
 */
import * as http from 'node:http';

export const STUB_PORT = 3099;

type Handler = (req: http.IncomingMessage, res: http.ServerResponse, body: string) => void;

const routes = new Map<string, Handler>();

/**
 * Prefix-based routes: matched when the request path starts with the key.
 * Used for endpoints with arbitrary query strings (e.g. nearby with lat/lng).
 */
const prefixRoutes: Array<{ method: string; prefix: string; handler: Handler }> = [];

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

function json(res: http.ServerResponse, status: number, body: unknown): void {
	const payload = JSON.stringify(body);
	res.writeHead(status, {
		'Content-Type': 'application/json',
		'Content-Length': Buffer.byteLength(payload)
	});
	res.end(payload);
}

function success(res: http.ServerResponse, data: unknown): void {
	json(res, 200, { success: true, data });
}

function failure(res: http.ServerResponse, status: number, code: string, message: string): void {
	json(res, status, { success: false, error: { code, message } });
}

function pagination(total: number) {
	return {
		next_cursor: null,
		prev_cursor: null,
		has_more: false,
		has_prev: false,
		total
	};
}

function paginated(data: unknown[]) {
	return {
		success: true,
		data,
		pagination: pagination(data.length)
	};
}

function occurrence(overrides: Record<string, unknown> = {}) {
	return {
		id: 1001,
		event_id: 'uuid-series-a',
		name: { id: 'Kajian Tafsir Al-Quran', en: 'Tafsir Al-Quran Study' },
		date_start: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
		date_end: null,
		date_prayer: 4,
		status: 0,
		going_count: 12,
		distance_km: 0.8,
		place: {
			id: 'place-uuid-1',
			slug: 'masjid-al-falah',
			name: { id: 'Masjid Al-Falah', en: 'Masjid Al-Falah' },
			address: 'Jl. Contoh No. 1, Cirebon',
			lat: -6.732,
			lng: 108.5523
		},
		...overrides
	};
}

function defaultOccurrences() {
	return [
		occurrence(),
		occurrence({
			id: 1002,
			event_id: 'uuid-series-b',
			name: { id: "Pengajian Ibu-Ibu Ba'da Isya", en: 'Post-Isha Study Circle' },
			date_start: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
			date_prayer: 2,
			going_count: 7,
			distance_km: 1.4,
			place: {
				id: 'place-uuid-2',
				slug: 'masjid-jami-cirebon',
				name: { id: "Masjid Jami' Cirebon", en: "Masjid Jami' Cirebon" },
				address: "Jl. Jami' No. 5, Cirebon",
				lat: -6.74,
				lng: 108.561
			}
		})
	];
}

function futureFallbackOccurrences() {
	const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
	const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
	return [
		occurrence({
			id: 2001,
			event_id: 'uuid-future-a',
			name: { id: 'Kajian Fiqih Mendatang' },
			date_start: tomorrow,
			distance_km: 18,
			place: {
				id: 'place-future-1',
				slug: 'masjid-future-one',
				name: { id: 'Masjid Masa Depan' },
				address: 'Jl. Besok No. 1, Cirebon',
				lat: -6.71,
				lng: 108.58
			}
		}),
		occurrence({
			id: 2002,
			event_id: 'uuid-future-b',
			name: { id: 'Kajian Fiqih Pekanan' },
			date_start: nextWeek,
			distance_km: 18,
			place: {
				id: 'place-future-1',
				slug: 'masjid-future-one',
				name: { id: 'Masjid Masa Depan' },
				address: 'Jl. Besok No. 1, Cirebon',
				lat: -6.71,
				lng: 108.58
			}
		}),
		occurrence({
			id: 2003,
			event_id: 'uuid-future-c',
			name: { id: 'Kajian Sirah Mendatang' },
			date_start: nextWeek,
			distance_km: 42,
			place: {
				id: 'place-future-2',
				slug: 'masjid-future-two',
				name: { id: 'Masjid Radius Luas' },
				address: 'Jl. Luas No. 2, Cirebon',
				lat: -6.69,
				lng: 108.6
			}
		})
	];
}

// ---------------------------------------------------------------------------
// Route definitions
// ---------------------------------------------------------------------------

// POST /auth/login
routes.set('POST:/auth/login', (req, res, body) => {
	let parsed: { email?: string; password?: string };
	try {
		parsed = JSON.parse(body);
	} catch {
		return failure(res, 400, 'INVALID_JSON', 'Invalid JSON body');
	}

	if (parsed.email === 'alice@example.com' && parsed.password === 'correct-password') {
		return success(res, {
			accessToken: 'stub-access-token',
			refreshToken: 'stub-refresh-token',
			expiresIn: 3600,
			user: { id: 'user-1', email: 'alice@example.com' },
			role: 'user'
		});
	}

	return failure(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
});

// POST /auth/logout
routes.set('POST:/auth/logout', (_req, res) => {
	success(res, null);
});

// POST /auth/refresh
routes.set('POST:/auth/refresh', (_req, res, body) => {
	let parsed: { refreshToken?: string };
	try {
		parsed = JSON.parse(body);
	} catch {
		return failure(res, 400, 'INVALID_JSON', 'Invalid JSON body');
	}

	if (parsed.refreshToken === 'stub-refresh-token') {
		return success(res, {
			accessToken: 'stub-access-token-refreshed',
			refreshToken: 'stub-refresh-token-refreshed',
			expiresIn: 3600,
			user: { id: 'user-1', email: 'alice@example.com' },
			role: 'user'
		});
	}

	json(res, 401, null);
});

// GET /auth/session
routes.set('GET:/auth/session', (_req, res) => {
	success(res, {
		user: { id: 'user-1', email: 'alice@example.com' },
		role: 'user'
	});
});

// GET /subjects?… (prefix match — peta subject filter)
prefixRoutes.push({
	method: 'GET',
	prefix: '/subjects',
	handler: (_req, res) => {
		json(
			res,
			200,
			paginated([
				{
					id: 'subject-tafsir',
					slug: 'tafsir',
					name: { id: 'Tafsir' },
					description: { id: 'Kajian tafsir.' },
					is_active: true
				},
				{
					id: 'subject-empty',
					slug: 'fiqih',
					name: { id: 'Fiqih' },
					description: { id: 'Kajian fiqih.' },
					is_active: true
				}
			])
		);
	}
});

// GET /events/nearby?… (prefix match — handles any query string combination)
prefixRoutes.push({
	method: 'GET',
	prefix: '/events/nearby',
	handler: (req, res) => {
		const params = new URL(req.url ?? '/', 'http://localhost').searchParams;
		const subjectId = params.get('subject_id');
		const radiusKm = Number(params.get('radius_km') ?? '10');
		const limit = Number(params.get('limit') ?? '10');

		if (subjectId === 'subject-empty' && limit < 30) {
			return json(res, 200, {
				success: true,
				data: [],
				pagination: pagination(0)
			});
		}

		if (subjectId === 'subject-empty' && radiusKm >= 100 && limit >= 30) {
			return json(res, 200, {
				success: true,
				data: futureFallbackOccurrences(),
				pagination: pagination(3)
			});
		}

		if (subjectId === 'subject-tafsir') {
			return json(res, 200, {
				success: true,
				data: [occurrence({ id: 3001, event_id: 'uuid-tafsir-a' })],
				pagination: pagination(1)
			});
		}

		json(res, 200, {
			success: true,
			data: defaultOccurrences(),
			pagination: pagination(2)
		});
	}
});

// ---------------------------------------------------------------------------
// Server factory
// ---------------------------------------------------------------------------

export function createStubServer(): http.Server {
	const server = http.createServer((req, res) => {
		const method = req.method ?? 'GET';
		const url = req.url ?? '/';
		const key = `${method}:${url}`;

		// Path without query string — for prefix matching.
		const path = url.split('?')[0];

		let body = '';
		req.on('data', (chunk) => (body += chunk));
		req.on('end', () => {
			// Exact match first.
			const handler = routes.get(key);
			if (handler) {
				handler(req, res, body);
				return;
			}

			// Prefix match (method + path starts with prefix).
			const prefixMatch = prefixRoutes.find(
				(r) => r.method === method && path.startsWith(r.prefix)
			);
			if (prefixMatch) {
				prefixMatch.handler(req, res, body);
				return;
			}

			json(res, 404, {
				success: false,
				error: { code: 'NOT_FOUND', message: `${key} not found` }
			});
		});
	});

	return server;
}
