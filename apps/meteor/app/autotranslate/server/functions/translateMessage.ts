import type { IMessage } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';

import { TranslationProviderRegistry, type TranslateMessageOptions } from '..';

export const translateMessage = async (targetLanguage?: string, message?: IMessage, options?: TranslateMessageOptions) => {
	if (!TranslationProviderRegistry.enabled) {
		return;
	}
	if (!message?.rid) {
		return;
	}

	const room = await Rooms.findOneById(message?.rid);
	let translatedMessage;

	if (message && room) {
		translatedMessage = await TranslationProviderRegistry.translateMessage(message, room, targetLanguage, options);
	}

	if (!translatedMessage) {
		return;
	}

	return translatedMessage;
};
