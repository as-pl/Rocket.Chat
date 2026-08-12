import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { OmnichannelLiveChat } from '../page-objects/omnichannel';
import { expect, test } from '../utils/test';

test.describe('OC - Contact Unknown Callout', () => {
	test.skip(!IS_EE, 'Enterprise Only');

	let poLiveChat: OmnichannelLiveChat;
	let newVisitor: { email: string; name: string };

	let agent: { page: Page; poHomeChannel: HomeChannel };

	test.beforeAll(async ({ api, browser }) => {
		newVisitor = createFakeVisitor();

		await api.post('/livechat/users/agent', { username: 'user1' });
		await api.post('/livechat/users/manager', { username: 'user1' });

		const { page } = await createAuxContext(browser, Users.user1);
		agent = { page, poHomeChannel: new HomeChannel(page) };
	});
	test.beforeEach(async ({ page, api }) => {
		poLiveChat = new OmnichannelLiveChat(page, api);
	});

	test.beforeEach('create livechat conversation', async ({ page }) => {
		await page.goto('/livechat');
		await poLiveChat.openLiveChat();
		await poLiveChat.sendMessage(newVisitor, false);
		await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
		await poLiveChat.btnSendMessageToOnlineAgent.click();
	});

	test.afterEach('close livechat conversation', async () => {
		await poLiveChat.closeChat();
	});

	test.afterAll(async ({ api }) => {
		await api.delete('/livechat/users/agent/user1');
		await api.delete('/livechat/users/manager/user1');
		await agent.page.close();
	});

	// AS-PL customization: protect the fork behavior that anonymous B2B LiveChat visitors do not trigger the unknown-contact warning.
	test('OC - Contact Unknown Callout - hidden for AS-PL LiveChat', async () => {
		await test.step('expect to open conversation', async () => {
			await agent.poHomeChannel.navbar.openChat(newVisitor.name);
		});

		await test.step('expect contact unknown callout to stay hidden', async () => {
			await expect(agent.poHomeChannel.content.contactUnknownCallout).not.toBeVisible();
		});
	});
});
