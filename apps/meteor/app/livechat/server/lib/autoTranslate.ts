import { isMessageFromVisitor, isTranslatedMessage, type IMessage } from '@rocket.chat/core-typings';

import { translateMessage } from '../../../autotranslate/server/functions/translateMessage';
import { settings } from '../../../settings/server';

const pendingLivechatTranslations = new Set<string>();
const livechatTranslationPendingTimeout = 5 * 60 * 1000;
const livechatRoomAutoTranslateLanguages = new Map<string, string>();
const livechatRoomAutoTranslateLanguageTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const livechatRoomAutoTranslateLanguageTimeout = 24 * 60 * 60 * 1000;

const unrefTimer = (timer: ReturnType<typeof setTimeout>): void => {
	if (typeof timer === 'object' && 'unref' in timer && typeof timer.unref === 'function') {
		timer.unref();
	}
};

const getLanguageCandidates = (language: string): string[] => {
	const [baseLanguage] = language.split(/[-_]/);
	return [...new Set([language, baseLanguage].filter(Boolean))];
};

const hasTranslation = (message: IMessage, language: string): boolean => {
	if (!isTranslatedMessage(message)) {
		return false;
	}

	return getLanguageCandidates(language).some((candidate) => Boolean(message.translations[candidate]));
};

const shouldTranslateAgentMessageForLivechat = (message: IMessage, targetLanguage?: string): targetLanguage is string => {
	if (!targetLanguage || !settings.get('AutoTranslate_Enabled')) {
		return false;
	}

	if (!message._id || !message.rid || !message.msg || message.t || isMessageFromVisitor(message)) {
		return false;
	}

	return !hasTranslation(message, targetLanguage);
};

export const rememberLivechatRoomAutoTranslateLanguage = (rid: string, targetLanguage?: string): void => {
	if (!targetLanguage) {
		return;
	}

	livechatRoomAutoTranslateLanguages.set(rid, targetLanguage);

	const currentTimeout = livechatRoomAutoTranslateLanguageTimeouts.get(rid);
	if (currentTimeout) {
		clearTimeout(currentTimeout);
	}

	const timeout = setTimeout(() => {
		livechatRoomAutoTranslateLanguages.delete(rid);
		livechatRoomAutoTranslateLanguageTimeouts.delete(rid);
	}, livechatRoomAutoTranslateLanguageTimeout);
	unrefTimer(timeout);
	livechatRoomAutoTranslateLanguageTimeouts.set(rid, timeout);
};

export const getLivechatRoomAutoTranslateLanguage = (rid: string): string | undefined => livechatRoomAutoTranslateLanguages.get(rid);

export const requestAgentMessageTranslationForLivechat = (message: IMessage, targetLanguage?: string): void => {
	if (!shouldTranslateAgentMessageForLivechat(message, targetLanguage)) {
		return;
	}

	const key = `${message._id}:${targetLanguage}`;
	if (pendingLivechatTranslations.has(key)) {
		return;
	}

	pendingLivechatTranslations.add(key);
	void translateMessage(targetLanguage, message).catch(() => pendingLivechatTranslations.delete(key));
	const timeout = setTimeout(() => pendingLivechatTranslations.delete(key), livechatTranslationPendingTimeout);
	unrefTimer(timeout);
};

export const requestMissingAgentMessagesTranslationsForLivechat = (messages: IMessage[], targetLanguage?: string): void => {
	messages.forEach((message) => requestAgentMessageTranslationForLivechat(message, targetLanguage));
};
