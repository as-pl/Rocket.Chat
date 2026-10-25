import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';

import { useEmployeeCards } from './useEmployeeCards';

// AS-PL customization: measure real query-cache reuse as the forwarding search changes and reopens.
let mockViewer = { username: 'viewer', _id: 'viewer-id' };
jest.mock('@rocket.chat/ui-contexts', () => ({ useUser: () => mockViewer }));
jest.mock('../../../../lib/loginServices', () => ({
	loginServices: {
		onLoad: (callback: (services: unknown[]) => void) => {
			callback([{ service: 'aspl', serverURL: 'https://erp.example.test' }]);
			return () => undefined;
		},
	},
}));

const originalFetch = global.fetch;
afterEach(() => {
	global.fetch = originalFetch;
	mockViewer = { username: 'viewer', _id: 'viewer-id' };
});

it('fetches 25 users once, only the new user on another search, and nothing when reopened', async () => {
	const send = jest.fn().mockImplementation(async (_url, init) => ({
		ok: true,
		json: async () => ({
			employees: JSON.parse(init.body).usernames.map((username: string) => ({
				username,
				departments: ['Sales'],
				date: '2026-10-26',
				workStart: '',
				workEnd: '',
				absences: [],
			})),
		}),
	}));
	global.fetch = send;
	const client = new QueryClient();
	const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
	const usernames = Array.from({ length: 25 }, (_, index) => `user${index}`);
	const view = renderHook(({ names }) => useEmployeeCards(names, true), { wrapper, initialProps: { names: usernames } });
	await waitFor(() => expect(view.result.current.cards.get('user24')?.department).toBe('Sales'));
	expect(send).toHaveBeenCalledTimes(1);
	view.rerender({ names: [...usernames.slice(1), 'new-user'] });
	await waitFor(() => expect(view.result.current.cards.get('new-user')?.department).toBe('Sales'));
	expect(send).toHaveBeenCalledTimes(2);
	expect(JSON.parse(send.mock.calls[1][1].body).usernames).toEqual(['new-user']);
	view.unmount();
	const { result: reopened, unmount } = renderHook(() => useEmployeeCards(usernames, true), { wrapper });
	await waitFor(() => expect(reopened.current.cards.get('user0')?.department).toBe('Sales'));
	expect(send).toHaveBeenCalledTimes(2);
	unmount();
	client.clear();
});

it('does not fetch while typing and isolates the cache for another chat account', async () => {
	const send = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ employees: [] }) });
	global.fetch = send;
	const client = new QueryClient();
	const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
	const { result, rerender, unmount } = renderHook(({ enabled }) => useEmployeeCards(['person'], enabled), {
		wrapper,
		initialProps: { enabled: false },
	});
	expect(send).not.toHaveBeenCalled();
	rerender({ enabled: true });
	await waitFor(() => expect(result.current.cards.get('person')).toBeNull());
	expect(send).toHaveBeenCalledTimes(1);
	mockViewer = { username: 'other', _id: 'other-id' };
	rerender({ enabled: true });
	await waitFor(() => expect(send).toHaveBeenCalledTimes(2));
	expect(JSON.parse(send.mock.calls[1][1].body).viewer).toBe('other');
	unmount();
	client.clear();
});
