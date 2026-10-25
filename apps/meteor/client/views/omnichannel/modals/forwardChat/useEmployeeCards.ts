import { useUser } from '@rocket.chat/ui-contexts';
import { useQueries } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { createEmployeeCardsBatcher } from './employeeCards';
import { loginServices } from '../../../../lib/loginServices';

// AS-PL customization: only the forwarding modal subscribes to ERP; its normal agent picker works without an ERP session.
export function useEmployeeCards(usernames: string[], enabled: boolean) {
	const user = useUser();
	const [baseUrl, setBaseUrl] = useState('');
	useEffect(
		() =>
			loginServices.onLoad((services) => {
				const service = services.find(({ service }) => service === 'aspl');
				setBaseUrl(service && 'serverURL' in service ? service.serverURL || '' : '');
			}),
		[],
	);
	const viewer = user?.username || '';
	const identity = user?._id || '';
	const load = useMemo(() => createEmployeeCardsBatcher(baseUrl, viewer), [baseUrl, viewer]);
	const names = [...new Set(usernames.filter(Boolean))];
	const results = useQueries({
		queries: names.map((username) => ({
			queryKey: ['aspl-forward-employee', baseUrl, identity, viewer, username],
			queryFn: ({ signal }: { signal: AbortSignal }) => load(username, signal),
			enabled: enabled && !!baseUrl && !!viewer,
			staleTime: 60_000,
			gcTime: 5 * 60_000,
			retry: false,
			refetchOnWindowFocus: false,
		})),
	});
	return {
		cards: new Map(names.map((name, index) => [name, results[index].data])),
		error: results.find(({ isError }) => isError)?.error,
	};
}
