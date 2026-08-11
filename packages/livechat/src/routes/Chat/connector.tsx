import type { TFunction } from 'i18next';
import i18next from 'i18next';
import type { Ref } from 'preact';
import { useCallback, useContext, useMemo, useState } from 'preact/hooks';
import { withTranslation } from 'react-i18next';

import { ChatContainer } from '.';
import { ScreenContext } from '../../components/Screen/ScreenProvider';
import { canRenderMessage } from '../../helpers/canRenderMessage';
import { formatAgent } from '../../helpers/formatAgent';
import {
	configLanguage,
	getNativeLanguageName,
	getSelectableChatLanguages,
	haveSameBaseLanguage,
	normalizeLivechatLanguage,
} from '../../lib/locale';
import { createToken } from '../../lib/random';
import { loadMessages } from '../../lib/room';
import { StoreContext } from '../../store';

type ChatConnectorProps = {
	path: string;
	default: boolean;
	t: TFunction;
	ref?: Ref<any>;
};

export const ChatConnector = ({ ref, t }: ChatConnectorProps) => {
	const { theme } = useContext(ScreenContext);
	const [languageChangePending, setLanguageChangePending] = useState(false);
	const {
		config: {
			settings: {
				fileUpload: uploads,
				allowSwitchingDepartments,
				forceAcceptDataProcessingConsent: allowRemoveUserData,
				showConnecting,
				registrationForm,
				nameFieldRegistrationForm,
				emailFieldRegistrationForm,
				limitTextLength,
				visitorsCanCloseChat,
			},
			messages: { conversationFinishedMessage },
			departments = {},
		},
		iframe: { theme: { title: customTitle = '' } = {}, guest = {}, language: configuredPageLanguage },
		token,
		agent,
		sound,
		user,
		room,
		messages,
		noMoreMessages,
		typing,
		loading,
		dispatch,
		alerts,
		visible,
		unread,
		lastReadMessageId,
		triggerAgent,
		queueInfo,
		messageListPosition,
	} = useContext(StoreContext);

	const selectableLanguages = useMemo(() => getSelectableChatLanguages(configuredPageLanguage), [configuredPageLanguage]);
	const activeLanguage = normalizeLivechatLanguage(configLanguage() || selectableLanguages[0] || 'en');
	const targetLanguage = selectableLanguages.find((language) => !haveSameBaseLanguage(language, activeLanguage));

	const handleLanguageChange = useCallback(async () => {
		if (!targetLanguage || languageChangePending) {
			return;
		}

		setLanguageChangePending(true);
		dispatch({
			conversationLanguage: targetLanguage,
			languageSelectionConfirmed: true,
		});

		try {
			await i18next.changeLanguage(targetLanguage);
			if (room?._id) {
				await loadMessages();
			}
		} catch (error) {
			console.error(error);
			dispatch({
				loading: false,
				alerts: [
					...(alerts || []),
					{
						id: createToken(),
						children: t('error_changing_chat_language'),
						error: true,
						timeout: 5000,
					},
				],
			});
		} finally {
			setLanguageChangePending(false);
		}
	}, [alerts, dispatch, languageChangePending, room?._id, t, targetLanguage]);

	const languageAction = targetLanguage
		? {
				code: targetLanguage.split('-')[0].toUpperCase(),
				label: t('switch_chat_language_to', { language: getNativeLanguageName(targetLanguage) }),
				disabled: languageChangePending,
				onClick: handleLanguageChange,
			}
		: undefined;

	return (
		<ChatContainer
			ref={ref}
			title={customTitle || t('livechat_title') || t('need_help')}
			sound={sound}
			token={token}
			user={user}
			agent={formatAgent(agent)}
			room={room}
			messages={messages?.filter(canRenderMessage)}
			noMoreMessages={noMoreMessages}
			emoji={true}
			uploads={uploads}
			typingUsernames={Array.isArray(typing) ? typing : []}
			loading={loading}
			showConnecting={showConnecting} // setting from server that tells if app needs to show "connecting" sometimes
			connecting={!!(room && !agent && (showConnecting || queueInfo))}
			dispatch={dispatch}
			departments={departments}
			allowSwitchingDepartments={allowSwitchingDepartments}
			conversationFinishedMessage={conversationFinishedMessage || t('conversation_finished')}
			allowRemoveUserData={allowRemoveUserData}
			alerts={alerts}
			visible={visible}
			unread={unread}
			lastReadMessageId={lastReadMessageId}
			guest={guest}
			triggerAgent={triggerAgent}
			queueInfo={
				queueInfo
					? {
							spot: queueInfo.spot,
							estimatedWaitTimeSeconds: queueInfo.estimatedWaitTimeSeconds,
							message: queueInfo.message,
						}
					: undefined
			}
			registrationFormEnabled={registrationForm}
			nameFieldRegistrationForm={nameFieldRegistrationForm}
			emailFieldRegistrationForm={emailFieldRegistrationForm}
			limitTextLength={limitTextLength}
			messageListPosition={messageListPosition}
			theme={theme}
			visitorsCanCloseChat={visitorsCanCloseChat}
			languageAction={languageAction}
		/>
	);
};

export default withTranslation()(ChatConnector);
