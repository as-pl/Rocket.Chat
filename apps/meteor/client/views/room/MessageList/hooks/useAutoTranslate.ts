import type { IMessage, IRoom, ISubscription, ITranslatedMessage } from '@rocket.chat/core-typings';
import { useSetting, useUser } from '@rocket.chat/ui-contexts';
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
	const workspaceLanguage = useSetting('Language', 'en');
	const user = useUser();
	const isSubscriptionEnabled = autoTranslateSettingEnabled && subscription?.autoTranslateLanguage && subscription?.autoTranslate;
	// AS-PL customization: before an agent takes a LiveChat there is no subscription, so identify the room from RoomContext as a fallback.
	const roomType = subscription?.t ?? room?.t;
	const isLivechatRoom = useMemo(() => Boolean(roomType && roomCoordinator.isLivechatRoom(roomType)), [roomType]);
	const autoTranslateEnabled = Boolean(isSubscriptionEnabled || isLivechatRoom);
	// AS-PL customization: the queued room id lets LiveChat resolve translations before an agent subscription exists.
	const rid = subscription?.rid ?? room?._id;
	const configuredLanguage = autoTranslateEnabled && rid ? AutoTranslate.getLanguage(rid) : undefined;
	// AS-PL customization: before acceptance, agents without a profile language must use the workspace language that generated the queued message translation.
	const autoTranslateLanguage =
		isLivechatRoom && !subscription?.autoTranslateLanguage && !user?.language && workspaceLanguage !== 'default'
			? workspaceLanguage
			: configuredLanguage;

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
