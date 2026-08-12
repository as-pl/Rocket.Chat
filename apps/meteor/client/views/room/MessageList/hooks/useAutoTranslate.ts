import type { IMessage, IRoom, ISubscription, ITranslatedMessage } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo } from 'react';

import { AutoTranslate } from '../../../../../app/autotranslate/client';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { hasTranslationLanguageInAttachments, hasTranslationLanguageInMessage } from '../lib/autoTranslate';
import { isOwnUserMessage } from '../lib/isOwnUserMessage';

export type AutoTranslateOptions = {
	autoTranslateEnabled: boolean;
	autoTranslateLanguage?: string;
	showAutoTranslate: (message: IMessage & Partial<ITranslatedMessage>) => boolean;
};

export const useAutoTranslate = (subscription?: ISubscription, room?: IRoom): AutoTranslateOptions => {
	const autoTranslateSettingEnabled = useSetting('AutoTranslate_Enabled', false);
	const isSubscriptionEnabled = autoTranslateSettingEnabled && subscription?.autoTranslateLanguage && subscription?.autoTranslate;
	// AS-PL customization: before an agent takes a LiveChat there is no subscription, so identify the room from RoomContext as a fallback.
	const roomType = subscription?.t ?? room?.t;
	const isLivechatRoom = useMemo(() => Boolean(roomType && roomCoordinator.isLivechatRoom(roomType)), [roomType]);
	const autoTranslateEnabled = Boolean(isSubscriptionEnabled || isLivechatRoom);
	// AS-PL customization: AutoTranslate already falls back to the logged-in user's language; it only needs the queued room id when no subscription exists.
	const rid = subscription?.rid ?? room?._id;
	const autoTranslateLanguage = autoTranslateEnabled && rid ? AutoTranslate.getLanguage(rid) : undefined;

	const showAutoTranslate = useCallback(
		(message: IMessage): boolean => {
			if (!autoTranslateEnabled || !autoTranslateLanguage) {
				return false;
			}

			return (
				!isOwnUserMessage(message, subscription) &&
				!(message as { autoTranslateShowInverse?: boolean }).autoTranslateShowInverse &&
				(hasTranslationLanguageInMessage(message, autoTranslateLanguage) ||
					hasTranslationLanguageInAttachments(message.attachments, autoTranslateLanguage))
			);
		},
		[subscription, autoTranslateEnabled, autoTranslateLanguage],
	);

	return useMemo(() => {
		return { autoTranslateEnabled, autoTranslateLanguage, showAutoTranslate };
	}, [autoTranslateEnabled, autoTranslateLanguage, showAutoTranslate]);
};
