import { z } from 'zod';

// AS-PL customization: forwarding agents need live ERP availability without copying ERP credentials into chat.
const employeeCard = z
	.object({
		username: z.string(),
		departments: z.array(z.string()),
		date: z.iso.date(),
		workStart: z.string(),
		workEnd: z.string(),
		absences: z.array(
			z.object({ from: z.iso.date(), to: z.iso.date(), kind: z.enum(['vacation', 'absence', 'home_office', 'business_trip']) }),
		),
	})
	.transform(({ username, departments, date, workStart, workEnd, absences }) => {
		const active = absences.filter(({ from, to }) => from <= date && to >= date);
		const absence = active.find(({ kind }) => kind === 'absence' || kind === 'vacation') || active[0] || absences[0];
		return {
			username,
			department: departments.join(' / '),
			workHours: workStart && workEnd ? `${workStart}–${workEnd}` : '',
			absence,
			absentToday: active.some(({ kind }) => kind === 'absence' || kind === 'vacation'),
		};
	});

export type EmployeeAvailability = z.output<typeof employeeCard>;

export class EmployeeCardsError extends Error {
	constructor(public readonly status: number) {
		super('ERP employee availability unavailable');
	}
}

type Pending = {
	resolve: (card: EmployeeAvailability | null) => void;
	reject: (error: Error) => void;
	signal: AbortSignal;
};

// AS-PL customization: React Query owns per-user caching; this queue combines simultaneous misses into bounded HTTP batches.
export function createEmployeeCardsBatcher(baseUrl: string, viewer: string, send: typeof fetch = (...args) => fetch(...args)) {
	const pending = new Map<string, Pending[]>();
	let timer: ReturnType<typeof setTimeout> | undefined;
	let blockedUntil = 0;
	let lastError: Error = new EmployeeCardsError(503);

	async function flush() {
		timer = undefined;
		const batch = [...pending.entries()].slice(0, 50);
		batch.forEach(([username]) => pending.delete(username));
		if (pending.size) timer = setTimeout(() => void flush(), 40);
		const active = batch.filter(([, requests]) => requests.some(({ signal }) => !signal.aborted));
		if (!active.length) return;
		const controller = new AbortController();
		const abortIfUnused = () => {
			if (active.every(([, requests]) => requests.every(({ signal }) => signal.aborted))) controller.abort();
		};
		active.forEach(([, requests]) => requests.forEach(({ signal }) => signal.addEventListener('abort', abortIfUnused, { once: true })));
		const timeout = setTimeout(() => controller.abort(), 8000);
		try {
			if (Date.now() < blockedUntil) throw lastError;
			const response = await send(new URL('/integrations/rocketchat/employee-cards', baseUrl), {
				method: 'POST',
				credentials: 'include',
				cache: 'no-store',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ viewer, usernames: active.map(([username]) => username) }),
				signal: controller.signal,
			});
			if (!response.ok) throw new EmployeeCardsError(response.status);
			const { employees } = z.object({ employees: z.array(employeeCard) }).parse(await response.json());
			const byUsername = new Map(employees.map((card) => [card.username.toLowerCase(), card]));
			active.forEach(([username, requests]) => requests.forEach(({ resolve }) => resolve(byUsername.get(username.toLowerCase()) ?? null)));
		} catch (reason) {
			const error = reason instanceof Error ? reason : new EmployeeCardsError(503);
			if (!controller.signal.aborted || active.some(([, requests]) => requests.some(({ signal }) => !signal.aborted))) {
				lastError = error;
				blockedUntil = Date.now() + (error instanceof EmployeeCardsError && [401, 403].includes(error.status) ? 60_000 : 15_000);
			}
			active.forEach(([, requests]) => requests.forEach(({ reject }) => reject(error)));
		} finally {
			clearTimeout(timeout);
			active.forEach(([, requests]) => requests.forEach(({ signal }) => signal.removeEventListener('abort', abortIfUnused)));
		}
	}

	return (username: string, signal: AbortSignal): Promise<EmployeeAvailability | null> => {
		if (signal.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'));
		if (Date.now() < blockedUntil) return Promise.reject(lastError);
		return new Promise((resolve, reject) => {
			const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
			const requests = pending.get(username) || [];
			requests.push({
				resolve: (card) => {
					signal.removeEventListener('abort', onAbort);
					resolve(card);
				},
				reject: (error) => {
					signal.removeEventListener('abort', onAbort);
					reject(error);
				},
				signal,
			});
			pending.set(username, requests);
			signal.addEventListener('abort', onAbort, { once: true });
			timer ??= setTimeout(() => void flush(), 40);
		});
	};
}
