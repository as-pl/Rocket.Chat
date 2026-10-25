import { createEmployeeCardsBatcher, EmployeeCardsError } from './employeeCards';

// AS-PL customization: protect the request budget and cancellation of ERP enrichment during chat forwarding.
const card = (username: string) => ({
	username,
	departments: ['Sales', 'Export'],
	date: '2026-10-26',
	workStart: '08:00',
	workEnd: '16:00',
	absences: [],
});
const success = (employees: unknown[]) => ({ ok: true, json: async () => ({ employees }) });

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('combines 25 rows and duplicate consumers into one credentialed request', async () => {
	const send = jest.fn().mockResolvedValue(success([card('User0')]));
	const load = createEmployeeCardsBatcher('https://erp.example.test', 'viewer', send);
	const requests = Array.from({ length: 25 }, (_, i) => load(`user${i}`, new AbortController().signal));
	requests.push(load('user0', new AbortController().signal));
	await jest.advanceTimersByTimeAsync(40);
	const results = await Promise.all(requests);
	expect(send).toHaveBeenCalledTimes(1);
	const [url, options] = send.mock.calls[0];
	expect(url.href).toBe('https://erp.example.test/integrations/rocketchat/employee-cards');
	expect(options.credentials).toBe('include');
	expect(options.headers).not.toHaveProperty('Authorization');
	expect(JSON.parse(options.body)).toEqual({ viewer: 'viewer', usernames: Array.from({ length: 25 }, (_, i) => `user${i}`) });
	expect(results[0]).toMatchObject({ department: 'Sales / Export', workHours: '08:00–16:00' });
	expect(results[1]).toBeNull();
	expect(results[25]).toEqual(results[0]);
});

it('splits a large list into batches of at most 50', async () => {
	const send = jest.fn().mockResolvedValue(success([]));
	const load = createEmployeeCardsBatcher('https://erp.example.test', 'viewer', send);
	const requests = Array.from({ length: 101 }, (_, i) => load(`user${i}`, new AbortController().signal));
	await jest.advanceTimersByTimeAsync(120);
	await Promise.all(requests);
	expect(send.mock.calls.map(([, options]) => JSON.parse(options.body).usernames.length)).toEqual([50, 50, 1]);
});

it('makes no request for a search cancelled before the batch is sent', async () => {
	const send = jest.fn();
	const load = createEmployeeCardsBatcher('https://erp.example.test', 'viewer', send);
	const controller = new AbortController();
	const result = load('old-search', controller.signal).catch((error) => error);
	controller.abort();
	await jest.advanceTimersByTimeAsync(40);
	expect((await result).name).toBe('AbortError');
	expect(send).not.toHaveBeenCalled();
});

it('keeps a shared request alive when only one row is cancelled', async () => {
	let finish!: (value: unknown) => void;
	const send = jest.fn().mockImplementation(
		() =>
			new Promise((resolve) => {
				finish = resolve;
			}),
	);
	const load = createEmployeeCardsBatcher('https://erp.example.test', 'viewer', send);
	const first = new AbortController();
	const cancelled = load('first', first.signal).catch((error) => error);
	const kept = load('second', new AbortController().signal);
	await jest.advanceTimersByTimeAsync(40);
	first.abort();
	expect(send.mock.calls[0][1].signal.aborted).toBe(false);
	finish(success([card('second')]));
	expect((await cancelled).name).toBe('AbortError');
	expect(await kept).toMatchObject({ username: 'second' });
});

it('backs off across new search results after an expired ERP session', async () => {
	const send = jest.fn().mockResolvedValue({ ok: false, status: 401 });
	const load = createEmployeeCardsBatcher('https://erp.example.test', 'viewer', send);
	const first = load('first', new AbortController().signal).catch((error) => error);
	await jest.advanceTimersByTimeAsync(40);
	expect(await first).toBeInstanceOf(EmployeeCardsError);
	await expect(load('second', new AbortController().signal)).rejects.toMatchObject({ status: 401 });
	expect(send).toHaveBeenCalledTimes(1);
	await jest.advanceTimersByTimeAsync(60_000);
	send.mockResolvedValue(success([]));
	const recovered = load('second', new AbortController().signal);
	await jest.advanceTimersByTimeAsync(40);
	expect(await recovered).toBeNull();
	expect(send).toHaveBeenCalledTimes(2);
});

it('prefers a current absence over overlapping remote work and rejects malformed data', async () => {
	const send = jest.fn().mockResolvedValue(
		success([
			{
				...card('person'),
				absences: [
					{ from: '2026-10-26', to: '2026-10-26', kind: 'home_office' },
					{ from: '2026-10-26', to: '2026-10-27', kind: 'vacation' },
				],
			},
		]),
	);
	const load = createEmployeeCardsBatcher('https://erp.example.test', 'viewer', send);
	const result = load('person', new AbortController().signal);
	await jest.advanceTimersByTimeAsync(40);
	expect(await result).toMatchObject({ absentToday: true, absence: { kind: 'vacation' } });
	send.mockResolvedValue(success([{ username: 'broken' }]));
	const broken = load('broken', new AbortController().signal).catch((error) => error);
	await jest.advanceTimersByTimeAsync(40);
	expect(await broken).toBeInstanceOf(Error);
});
