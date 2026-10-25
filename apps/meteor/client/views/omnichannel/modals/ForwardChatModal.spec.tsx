import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { VirtuosoMockContext } from 'react-virtuoso';

import ForwardChatModal from './ForwardChatModal';
import * as stories from './ForwardChatModal.stories';
import { createFakeAgent, createFakeOmnichannelRoom } from '../../../../tests/mocks/data';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

jest.mock('../../../../client/lib/LegacyRoomManager', () => ({
	LegacyRoomManager: {
		close: jest.fn(),
	},
}));

// AS-PL customization: modal tests do not contact a real ERP/OAuth server; enrichment has its own request-budget tests.
jest.mock('../../../lib/loginServices', () => ({
	loginServices: { onLoad: () => () => undefined },
}));

const appRoot = mockAppRoot().build();

test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
	const { baseElement } = render(<Story />, { wrapper: appRoot });
	expect(baseElement).toMatchSnapshot();
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />, { wrapper: appRoot });

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

// AS-PL customization: forwarding must use the selected Rocket.Chat ID even when ERP enrichment is unavailable.
it('forwards to the selected agent without looking up an ID as a username', async () => {
	const agent = createFakeAgent({ _id: 'target-id', username: 'anna', name: 'Anna' });
	const forward = jest.fn().mockResolvedValue({ success: true });
	const lookup = jest.fn();
	const onCancel = jest.fn();
	const room = createFakeOmnichannelRoom({ _id: 'test-room' });
	const wrapper = mockAppRoot()
		.withEndpoint('GET', '/v1/livechat/users/agent', () => ({ users: [{ ...agent, departments: [] }], offset: 0, count: 1, total: 1 }))
		.withEndpoint('POST', '/v1/livechat/room.forward', forward)
		.withEndpoint('GET', '/v1/users.info', lookup)
		.withRouter({ navigate: jest.fn() })
		.build();
	render(
		<VirtuosoMockContext.Provider value={{ viewportHeight: 300, itemHeight: 48 }}>
			<ForwardChatModal room={room} onCancel={onCancel} />
		</VirtuosoMockContext.Provider>,
		{ wrapper },
	);
	const user = userEvent.setup();
	await user.click(screen.getByPlaceholderText('Username_name_email'));
	await user.click(await screen.findByText('Anna (@anna)'));
	await user.click(screen.getByRole('button', { name: 'Forward' }));
	await waitFor(() => expect(forward).toHaveBeenCalledWith(expect.objectContaining({ roomId: 'test-room', userId: 'target-id' })));
	expect(lookup).not.toHaveBeenCalled();
	expect(onCancel).toHaveBeenCalled();
});
