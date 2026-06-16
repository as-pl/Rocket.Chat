import { callbacks } from '../../../../server/lib/callbacks';
import { getLivechatRoomAutoTranslateLanguage, requestAgentMessageTranslationForLivechat } from '../lib/autoTranslate';

callbacks.add(
	'afterOmnichannelSaveMessage',
	async (message, { room }) => {
		if (!message) {
			return message;
		}

		requestAgentMessageTranslationForLivechat(message, getLivechatRoomAutoTranslateLanguage(room._id));

		return message;
	},
	callbacks.priority.LOW,
	'livechat-auto-translate-agent-messages',
);
