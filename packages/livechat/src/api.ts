import { LivechatClientImpl } from '@rocket.chat/ddp-client';
import { parse } from 'query-string';

const host =
	window.SERVER_URL ??
	parse(window.location.search).serverUrl ??
	(process.env.NODE_ENV === 'development' ? process.env.ROCKET_CHAT_URL : null);
// window.SERVER_URL ??
// parse(window.location.search).serverUrl ??
// (process.env.NODE_ENV === 'development' ? 'https://chat.as-pl.com' : null);
export const useSsl = Boolean((Array.isArray(host) ? host[0] : host)?.match(/^https:/));

export const Livechat = LivechatClientImpl.create(host.replace(/^http/, 'ws'));

Livechat.rest.use(async function (request, next) {
	console.log('Host:', host);
	console.log('useSsl:', useSsl);

	try {
		return await next(...request);
	} catch (error) {
		if (error instanceof Response) {
			const e = await error.json();
			throw e;
		}

		throw error;
	}
});
