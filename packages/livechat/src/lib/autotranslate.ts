import { configLanguage, normalizeLanguageString } from './locale';

type TranslatableAttachment = {
	text?: string;
	description?: string;
	translations?: Record<string, string>;
	attachments?: TranslatableAttachment[];
};

type MessageWithTranslations = {
	msg?: string;
	translations?: Record<string, string>;
	attachments?: TranslatableAttachment[];
};

export const getAutoTranslateLanguage = (): string | undefined => {
	const language = configLanguage();

	if (!language) {
		return undefined;
	}

	return normalizeLanguageString(language);
};

export const prepareMessageForAutoTranslate = <T extends MessageWithTranslations>(message: T): T => {
	const language = getAutoTranslateLanguage();

	if (!language || !message.translations) {
		return message;
	}

	const translation = message.translations[language];

	if (!translation) {
		return message;
	}

	return {
		...message,
		...(translation && { msg: translation, translations: { ...message.translations, original: message.msg || '' } }),
	} as T;
};
