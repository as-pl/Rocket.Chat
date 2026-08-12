import type { IMessage, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useAutoTranslate } from './useAutoTranslate';
import { AutoTranslate } from '../../../../../app/autotranslate/client';

jest.mock('../../../../../app/autotranslate/client', () => ({
	AutoTranslate: {
		getLanguage: jest.fn(() => 'en'),
	},
}));

jest.mock('../../../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		isLivechatRoom: jest.fn((type?: string) => type === 'l'),
	},
}));

// AS-PL customization: these tests protect the no-subscription state that exists while an agent previews a queued LiveChat.
describe('useAutoTranslate for queued LiveChat rooms', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('uses the workspace language when the queued-room agent has no profile language', () => {
		const room = { _id: 'queued-room', t: 'l' } as IRoom;
		const message = {
			_id: 'visitor-message',
			rid: room._id,
			u: { _id: 'visitor', username: 'guest' },
			msg: 'Buongiorno',
			translations: { pl: 'Dzień dobry' },
			ts: new Date(),
			_updatedAt: new Date(),
		} as IMessage;

		const { result } = renderHook(() => useAutoTranslate(undefined, room), {
			wrapper: mockAppRoot().withSetting('AutoTranslate_Enabled', true).withSetting('Language', 'pl').build(),
		});

		expect(AutoTranslate.getLanguage).toHaveBeenCalledWith(room._id);
		expect(result.current.autoTranslateEnabled).toBe(true);
		expect(result.current.autoTranslateLanguage).toBe('pl');
		expect(result.current.showAutoTranslate(message)).toBe(true);
	});

	it('does not enable translation for an unsubscribed regular room', () => {
		const room = { _id: 'regular-room', t: 'c' } as IRoom;

		const { result } = renderHook(() => useAutoTranslate(undefined, room), {
			wrapper: mockAppRoot().withSetting('AutoTranslate_Enabled', true).withSetting('Language', 'pl').build(),
		});

		expect(result.current.autoTranslateEnabled).toBe(false);
		expect(result.current.autoTranslateLanguage).toBeUndefined();
	});

	it('keeps an explicitly selected agent profile language instead of the workspace language', () => {
		const room = { _id: 'queued-room', t: 'l' } as IRoom;
		const user = { _id: 'agent', username: 'agent', name: 'Agent', language: 'en' } as IUser;

		const { result } = renderHook(() => useAutoTranslate(undefined, room), {
			wrapper: mockAppRoot().withUser(user).withSetting('AutoTranslate_Enabled', true).withSetting('Language', 'pl').build(),
		});

		expect(result.current.autoTranslateLanguage).toBe('en');
	});

	it('keeps the subscription language path after the chat is taken', () => {
		jest.mocked(AutoTranslate.getLanguage).mockReturnValueOnce('pl');
		const subscription = {
			rid: 'taken-room',
			t: 'l',
			autoTranslate: true,
			autoTranslateLanguage: 'pl',
		} as ISubscription;

		const { result } = renderHook(() => useAutoTranslate(subscription), {
			wrapper: mockAppRoot().withSetting('AutoTranslate_Enabled', true).build(),
		});

		expect(AutoTranslate.getLanguage).toHaveBeenCalledWith(subscription.rid);
		expect(result.current.autoTranslateEnabled).toBe(true);
		expect(result.current.autoTranslateLanguage).toBe('pl');
	});
});
