import i18next from 'i18next';
import { useCallback, useContext, useMemo, useState } from 'preact/hooks';
import { useTranslation } from 'react-i18next';

import type { LanguageAction } from '../components/Screen/Header';
import {
	configLanguage,
	getNativeLanguageName,
	getSelectableChatLanguages,
	haveSameBaseLanguage,
	normalizeLivechatLanguage,
} from '../lib/locale';
import { createToken } from '../lib/random';
import { loadMessages } from '../lib/room';
import { StoreContext } from '../store';

// AS-PL customization: active chat and the offline contact form must expose the same language switch and persist the choice identically.
export const useChatLanguageAction = (): LanguageAction | undefined => {
	const { t } = useTranslation();
	const [languageChangePending, setLanguageChangePending] = useState(false);
	const {
		iframe: { language: configuredPageLanguage },
		room,
		dispatch,
		alerts,
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

			// AS-PL customization: the offline form has no room yet, so only an active conversation needs its translated history reloaded.
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

	return targetLanguage
		? {
				code: targetLanguage.split('-')[0].toUpperCase(),
				label: t('switch_chat_language_to', { language: getNativeLanguageName(targetLanguage) }),
				disabled: languageChangePending,
				onClick: () => void handleLanguageChange(),
			}
		: undefined;
};
