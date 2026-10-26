import { Box, Option, PaginatedSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmployeeCardsError } from './employeeCards';
import { useEmployeeCards } from './useEmployeeCards';
import { formatDate } from '../../../../lib/utils/dateFormat';
import type { AutoCompleteAgentProps } from '../../components/AutoCompleteAgent';
import { useAgentsList } from '../../hooks/useAgentsList';

// AS-PL customization: keep forwarding agents readable with full-width rows and planned availability, without department clutter.
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
		return (
			<Option
				{...optionProps}
				label={
					<Box
						display='flex'
						flexDirection='column'
						minWidth={0}
						paddingBlock={4}
						style={{ whiteSpace: 'normal', overflowWrap: 'anywhere' }}
					>
						<Box fontScale='p2m'>{label}</Box>
						{card?.workHours && (
							<Box fontScale='c1' color='hint' marginBlockStart={4}>
								{t('ASPL_Forward_work_hours', { hours: card.workHours })}
							</Box>
						)}
						{card?.absence && (
							<Box fontScale='c1' color='hint' marginBlockStart={2}>
								{t(`ASPL_Forward_${card.absence.kind}`, {
									from: formatDate(card.absence.from, 'L'),
									to: formatDate(card.absence.to, 'L'),
								})}
							</Box>
						)}
					</Box>
				}
			/>
		);
	};
	return (
		<Box width='100%' minWidth={0}>
			<PaginatedSelectFiltered
				{...props}
				width='100%'
				maxWidth='100%'
				flexShrink={0}
				withTitle={false}
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
