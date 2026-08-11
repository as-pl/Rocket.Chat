import i18next from 'i18next';
import { useContext, useEffect, useMemo } from 'preact/hooks';
import { route } from 'preact-router';
import { useTranslation } from 'react-i18next';

import styles from './styles.scss';
import { Screen, ScreenContent } from '../../components/Screen';
import { createClassName } from '../../helpers/createClassName';
import { getNativeLanguageName, getSelectableChatLanguages } from '../../lib/locale';
import { StoreContext } from '../../store';

type LanguageSelectionProps = {
	path: string;
};

const LanguageSelection = (_: LanguageSelectionProps) => {
	const { t } = useTranslation();
	const {
		iframe: { language: configuredPageLanguage },
		room,
		dispatch,
	} = useContext(StoreContext);

	const selectableLanguages = useMemo(() => getSelectableChatLanguages(configuredPageLanguage), [configuredPageLanguage]);
	const languagesMatch = selectableLanguages.length < 2;

	const languageOptions = useMemo(
		() =>
			selectableLanguages.map((language, index) => ({
				language,
				name: getNativeLanguageName(language),
				source: index === 0 ? t('website_language') : t('browser_language'),
			})),
		[selectableLanguages, t],
	);

	useEffect(() => {
		if (room || languagesMatch) {
			route('/');
		}
	}, [languagesMatch, room]);

	const handleLanguageSelection = async (language: string) => {
		dispatch({
			conversationLanguage: language,
			languageSelectionConfirmed: true,
		});
		await i18next.changeLanguage(language);
		route('/');
	};

	return (
		<Screen title={t('livechat_title')} className={createClassName(styles, 'language-selection')}>
			<ScreenContent full>
				<div className={createClassName(styles, 'language-selection__content')}>
					<div className={createClassName(styles, 'language-selection__intro')}>
						<h2 className={createClassName(styles, 'language-selection__title')}>{t('choose_chat_language')}</h2>
						<p className={createClassName(styles, 'language-selection__description')}>{t('language_mismatch_description')}</p>
					</div>

					<div className={createClassName(styles, 'language-selection__options')}>
						{languageOptions.map(({ language, name, source }) => (
							<button
								key={`${source}-${language}`}
								type='button'
								className={createClassName(styles, 'language-selection__option')}
								onClick={() => void handleLanguageSelection(language)}
							>
								<span className={createClassName(styles, 'language-selection__language-code')}>{language.split('-')[0]}</span>
								<span className={createClassName(styles, 'language-selection__option-copy')}>
									<strong>{name}</strong>
									<small>{source}</small>
								</span>
							</button>
						))}
					</div>
				</div>
			</ScreenContent>
		</Screen>
	);
};

export default LanguageSelection;
