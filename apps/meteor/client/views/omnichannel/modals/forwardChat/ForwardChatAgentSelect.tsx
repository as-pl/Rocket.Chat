import { Box, Option, PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmployeeCardsError } from './employeeCards';
import { useEmployeeCards } from './useEmployeeCards';
import type { AutoCompleteAgentProps } from '../../components/AutoCompleteAgent';
import { useAgentsList } from '../../hooks/useAgentsList';

// AS-PL customization: show ERP departments and planned availability only when choosing a chat's next agent.
const ForwardChatAgentSelect = ({
	value,
	onChange,
	excludeId,
	showIdleAgents = true,
	disabled,
	...props
}: Omit<AutoCompleteAgentProps, 'onlyAvailable' | 'haveAll' | 'haveNoAgentsSelectedOption'>) => {
	const { t } = useTranslation();
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 500);
	const {
		data: agents = [],
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useAgentsList({
		filter: debouncedFilter,
		onlyAvailable: true,
		excludeId,
		showIdleAgents,
	});
	const { cards, error } = useEmployeeCards(
		agents.map(({ username }) => username || ''),
		!disabled && filter === debouncedFilter,
	);
	const renderItem: ComponentProps<typeof PaginatedSelectFiltered>['renderItem'] = ({ value, label, ...optionProps }) => {
		const agent = agents.find((agent) => agent.value === value);
		const card = agent?.username ? cards.get(agent.username) : undefined;
		const details = [card?.department];
		if (card?.workHours) details.push(t('ASPL_Forward_work_hours', { hours: card.workHours }));
		if (card?.absence) details.push(t(`ASPL_Forward_${card.absence.kind}`, { from: card.absence.from, to: card.absence.to }));
		return (
			<Option
				{...optionProps}
				label={
					<Box display='flex' flexDirection='column' minWidth={0}>
						<Box>{label}</Box>
						{details.some(Boolean) && (
							<Box fontScale='c1' color='hint' style={{ whiteSpace: 'normal' }}>
								{details.filter(Boolean).join(' · ')}
							</Box>
						)}
					</Box>
				}
			/>
		);
	};
	return (
		<Box width='100%'>
			<PaginatedSelectFiltered
				{...props}
				value={value}
				onChange={onChange}
				disabled={disabled}
				filter={filter}
				setFilter={setFilter as (value: string | number | undefined) => void}
				options={agents}
				renderItem={renderItem}
				endReached={() => {
					if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
				}}
			/>
			{!!error && (
				<Box role='status' fontScale='c1' color='hint' marginBlockStart={4}>
					{t(
						error instanceof EmployeeCardsError && [401, 403].includes(error.status)
							? 'ASPL_Forward_erp_login'
							: 'ASPL_Forward_erp_unavailable',
					)}
				</Box>
			)}
		</Box>
	);
};

export default ForwardChatAgentSelect;
