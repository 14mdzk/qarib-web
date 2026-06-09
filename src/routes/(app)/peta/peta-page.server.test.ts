import { describe, expect, it, vi } from 'vitest';
import { api } from '$core/api';
import { load } from './+page.server.js';

vi.mock('$core/api', () => ({
	api: vi.fn()
}));

describe('/peta server load', () => {
	const mockedApi = vi.mocked(api);

	it('does not issue a date-bounded request from the deployment host timezone', async () => {
		const eventFetch = vi.fn();

		const result = await load({ fetch: eventFetch } as unknown as Parameters<typeof load>[0]);

		expect(mockedApi).not.toHaveBeenCalled();
		expect(eventFetch).not.toHaveBeenCalled();
		expect(result).toEqual({ initialData: null });
	});
});
