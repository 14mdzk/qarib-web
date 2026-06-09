/* eslint-disable @typescript-eslint/no-explicit-any -- test mocks for SvelteKit types */
import { describe, expect, it } from 'vitest';
import { load } from './+layout.server.js';

function mockCookies(getStub: (name: string) => string | undefined) {
	return {
		get: getStub,
		set: () => {},
		delete: () => {},
		serialize: () => ''
	} as any;
}

function mockUrl(path: string) {
	return new URL(`https://qarib.app${path}`);
}

describe('(app) layout server gate', () => {
	it('redirects to /lokasi when completion cookie is missing', async () => {
		const cookies = mockCookies(() => undefined);
		const url = mockUrl('/peta?x=1');

		try {
			await load({ cookies, url } as any);
			expect.unreachable('should have redirected');
		} catch (err: any) {
			expect(err.status).toBe(303);
			expect(err.location).toContain('/lokasi?returnTo=');
		}
	});

	it('preserves pathname and search in the returnTo parameter', async () => {
		const cookies = mockCookies(() => undefined);
		const url = mockUrl('/peta?x=1');

		try {
			await load({ cookies, url } as any);
			expect.unreachable('should have redirected');
		} catch (err: any) {
			expect(err.location).toContain(encodeURIComponent('/peta?x=1'));
		}
	});

	it('redirects to /lokasi when cookie value is not v1', async () => {
		const cookies = mockCookies(() => 'stale');
		const url = mockUrl('/peta');

		try {
			await load({ cookies, url } as any);
			expect.unreachable('should have redirected');
		} catch (err: any) {
			expect(err.status).toBe(303);
		}
	});

	it('proceeds when the v1 completion cookie is present', async () => {
		const cookies = mockCookies(() => 'v1');
		const url = mockUrl('/peta');

		const result = await load({ cookies, url } as any);
		expect(result).toEqual({ locationComplete: true });
	});
});
