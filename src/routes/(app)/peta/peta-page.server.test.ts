import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '$core/api';
import { load } from './+page.server.js';

vi.mock('$core/api', () => ({
	api: vi.fn()
}));

describe('/peta server load', () => {
	const mockedApi = vi.mocked(api);

	beforeEach(() => {
		vi.useFakeTimers();
		mockedApi.mockResolvedValue({
			data: [],
			pagination: {
				next_cursor: null,
				prev_cursor: null,
				has_more: false,
				has_prev: false,
				total: 0
			}
		} as never);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	it('seeds the Asia/Jakarta calendar day when the UTC host is still on the previous day', async () => {
		vi.setSystemTime(new Date('2026-05-31T17:30:00Z'));
		const eventFetch = vi.fn();

		await load({ fetch: eventFetch } as unknown as Parameters<typeof load>[0]);

		expect(mockedApi).toHaveBeenCalledWith(
			'events.nearby',
			expect.objectContaining({
				date_from: '2026-06-01T00:00:00+07:00',
				date_to: '2026-06-01T23:59:59+07:00'
			}),
			undefined,
			expect.objectContaining({ fetch: eventFetch })
		);
	});
});
