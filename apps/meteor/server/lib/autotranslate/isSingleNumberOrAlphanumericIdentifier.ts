// AS-PL customization: standalone LiveChat order or product identifiers have no reliable language and DeepL can fabricate text from them.
export const isSingleNumberOrAlphanumericIdentifier = (message: string): boolean => {
	const text = message.trim();

	return /^[\p{L}\p{N}]+$/u.test(text) && /\p{N}/u.test(text);
};
