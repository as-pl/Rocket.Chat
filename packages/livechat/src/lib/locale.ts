import type { Locale } from 'date-fns';

import store from '../store';
import { supportedLocales } from '../supportedLocales';

const languageAliases: Record<string, string> = {
	gb: 'en',
	ua: 'uk',
};

/**
 * To normalize Language String and return language code
 */
export const normalizeLanguageString = (languageString: string): string => {
	let [languageCode, countryCode]: (string | undefined)[] = languageString.split?.(/[-_]/) ?? [];
	if (languageCode?.length !== 2) {
		return 'en';
	}
	languageCode = languageCode.toLowerCase();

	if (countryCode?.length !== 2) {
		countryCode = undefined;
	} else {
		countryCode = countryCode.toUpperCase();
	}

	return countryCode ? `${languageCode}-${countryCode}` : languageCode;
};

export const normalizeLivechatLanguage = (languageString: string): string => {
	const normalizedLanguage = normalizeLanguageString(languageString);
	const [languageCode, countryCode] = normalizedLanguage.split('-');
	const normalizedLanguageCode = languageAliases[languageCode] || languageCode;

	return countryCode ? `${normalizedLanguageCode}-${countryCode}` : normalizedLanguageCode;
};

export const haveSameBaseLanguage = (firstLanguage: string, secondLanguage: string): boolean =>
	normalizeLivechatLanguage(firstLanguage).split('-')[0] === normalizeLivechatLanguage(secondLanguage).split('-')[0];

/**
 * To get browser Language of user
 */
export const browserLanguage = (): string => navigator.language;

/**
 * This is configured langauge
 */
export const configLanguage = (): string | undefined => {
	const { conversationLanguage, languageSelectionConfirmed, iframe: { language: iframeLanguage } = {} } = store.state;
	const language = (store.state.config?.settings as Record<string, unknown> | undefined)?.language as string | undefined;
	return (languageSelectionConfirmed && conversationLanguage) || iframeLanguage || language;
};

export const getDateFnsLocale = async (): Promise<Locale> => {
	let fullLanguage = configLanguage() || browserLanguage();
	fullLanguage = fullLanguage.toLowerCase();
	const [languageCode] = fullLanguage.split?.(/[-_]/) ?? [];
	const locale = [fullLanguage, languageCode, 'en-US'].find((lng) => supportedLocales.indexOf(lng) > -1);
	const { default: dateFnsLocale } = await import(`date-fns/locale/${locale}.js`);
	return dateFnsLocale as Locale;
};
