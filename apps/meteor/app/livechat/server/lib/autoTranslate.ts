import { isMessageFromVisitor, isTranslatedMessage, type IMessage } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';

import type { TranslateMessageOptions } from '../../../autotranslate/server/autotranslate';
import { translateMessage } from '../../../autotranslate/server/functions/translateMessage';
import { settings } from '../../../settings/server';

const pendingLivechatTranslations = new Set<string>();
const livechatTranslationPendingTimeout = 5 * 60 * 1000;
const livechatRoomAutoTranslateLanguages = new Map<string, string>();
const livechatRoomAutoTranslateLanguageTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const livechatRoomAutoTranslateLanguageTimeout = 24 * 60 * 60 * 1000;
const livechatTranslationContextMessageLimit = 5;
const livechatTranslationContextMaxLength = 3000;

type LivechatTranslationOptions = TranslateMessageOptions & {
	contextMessages?: IMessage[];
};

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

const getMessageTimestamp = (message: IMessage): number => message.ts?.getTime() ?? 0;

const getTranslationContextText = (message: IMessage): string | undefined => {
	if (message.t || !message.msg) {
		return;
	}

	const text = message.msg.replace(/\s+/g, ' ').trim();
	return text || undefined;
};

const trimTranslationContext = (context: string): string | undefined => {
	const trimmedContext = context.trim();
	if (!trimmedContext) {
		return;
	}

	if (trimmedContext.length <= livechatTranslationContextMaxLength) {
		return trimmedContext;
	}

	return trimmedContext.slice(-livechatTranslationContextMaxLength).trim();
};

const buildLivechatTranslationContext = (messages: IMessage[], message: IMessage): string | undefined => {
	const sortedMessages = [...messages].sort((a, b) => getMessageTimestamp(a) - getMessageTimestamp(b));
	const currentMessageIndex = sortedMessages.findIndex(({ _id }) => _id === message._id);
	const previousMessages = sortedMessages
		.filter((contextMessage, index) => {
			if (contextMessage._id === message._id || contextMessage.rid !== message.rid) {
				return false;
			}

			if (currentMessageIndex !== -1) {
				return index < currentMessageIndex;
			}

			return getMessageTimestamp(contextMessage) < getMessageTimestamp(message);
		})
		.map(getTranslationContextText)
		.filter((text): text is string => Boolean(text))
		.slice(-livechatTranslationContextMessageLimit);

	return trimTranslationContext(previousMessages.join('\n'));
};

const getLivechatTranslationContext = async (message: IMessage, contextMessages?: IMessage[]): Promise<string | undefined> => {
	if (contextMessages) {
		return buildLivechatTranslationContext(contextMessages, message);
	}

	if (!message.rid || !message.ts) {
		return;
	}

	const previousMessages = await Messages.findVisibleByRoomIdBeforeTimestamp(message.rid, message.ts, true, {
		sort: { ts: -1 },
		limit: livechatTranslationContextMessageLimit,
		projection: { _id: 1, rid: 1, msg: 1, t: 1, ts: 1 },
	}).toArray();

	return buildLivechatTranslationContext([...previousMessages, message], message);
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

const shouldTranslateVisitorMessageForAgent = (message: IMessage, targetLanguage?: string): targetLanguage is string => {
	if (!targetLanguage || !settings.get('AutoTranslate_Enabled')) {
		return false;
	}

	if (!message._id || !message.rid || !message.msg || message.t || !isMessageFromVisitor(message)) {
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

export const requestAgentMessageTranslationForLivechat = (
	message: IMessage,
	targetLanguage?: string,
	options?: LivechatTranslationOptions,
): void => {
	if (!shouldTranslateAgentMessageForLivechat(message, targetLanguage)) {
		return;
	}

	const key = `${message._id}:${targetLanguage}`;
	if (pendingLivechatTranslations.has(key)) {
		return;
	}

	pendingLivechatTranslations.add(key);
	void (async () => {
		const context = options?.context ?? (await getLivechatTranslationContext(message, options?.contextMessages));
		await translateMessage(targetLanguage, message, { context });
	})().catch(() => pendingLivechatTranslations.delete(key));
	const timeout = setTimeout(() => pendingLivechatTranslations.delete(key), livechatTranslationPendingTimeout);
	unrefTimer(timeout);
};

export const requestMissingAgentMessagesTranslationsForLivechat = (messages: IMessage[], targetLanguage?: string): void => {
	messages.forEach((message) => requestAgentMessageTranslationForLivechat(message, targetLanguage, { contextMessages: messages }));
};

export const requestVisitorMessageTranslationForAgent = (message: IMessage, targetLanguage?: string): void => {
	if (!shouldTranslateVisitorMessageForAgent(message, targetLanguage)) {
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

export const requestMissingVisitorMessagesTranslationsForAgent = (messages: IMessage[], targetLanguage?: string): void => {
	messages.forEach((message) => requestVisitorMessageTranslationForAgent(message, targetLanguage));
};
