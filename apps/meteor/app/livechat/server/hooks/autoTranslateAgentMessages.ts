import { isMessageFromVisitor } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../server/lib/callbacks';
import {
	getLivechatQueueAutoTranslateLanguage,
	getLivechatRoomAutoTranslateLanguage,
	requestAgentMessageTranslationForLivechat,
	requestVisitorMessageTranslationForAgent,
} from '../lib/autoTranslate';

callbacks.add(
	'afterOmnichannelSaveMessage',
	async (message, { room }) => {
		if (!message) {
			return message;
		}

		// AS-PL customization: start translating visitor messages while the inquiry is still queued, before an agent subscription exists.
		if (isMessageFromVisitor(message) && !room.servedBy) {
			requestVisitorMessageTranslationForAgent(message, getLivechatQueueAutoTranslateLanguage());
			return message;
		}

		// AS-PL customization: keep the existing visitor-facing translation path separate so queued visitor messages are never treated as agent messages.
		requestAgentMessageTranslationForLivechat(message, getLivechatRoomAutoTranslateLanguage(room._id));

		return message;
	},
	callbacks.priority.LOW,
	'livechat-auto-translate-agent-messages',
);
