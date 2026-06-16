import { memo } from 'preact/compat';
import { withTranslation } from 'react-i18next';

import { getAttachmentUrl } from '../../../helpers/baseUrl';
import { normalizeTransferHistoryMessage } from '../../../helpers/normalizeTransferHistoryMessage';
import { prepareMessageForAutoTranslate } from '../../../lib/autotranslate';
import { default as AudioAttachment } from '../AudioAttachment';
import { FileAttachment } from '../FileAttachment';
import { ImageAttachment } from '../ImageAttachment';
import { MessageAvatars } from '../MessageAvatars';
import MessageBlocks from '../MessageBlocks';
import { MessageBubble } from '../MessageBubble';
import { MessageContainer } from '../MessageContainer';
import { MessageContent } from '../MessageContent';
import { MessageText } from '../MessageText';
import MessageTime from '../MessageTime';
import VideoAttachment from '../VideoAttachment';
import {
	MESSAGE_TYPE_ROOM_NAME_CHANGED,
	MESSAGE_TYPE_USER_ADDED,
	MESSAGE_TYPE_USER_REMOVED,
	MESSAGE_TYPE_USER_JOINED,
	MESSAGE_TYPE_USER_LEFT,
	MESSAGE_TYPE_WELCOME,
	MESSAGE_TYPE_LIVECHAT_CLOSED,
	MESSAGE_TYPE_LIVECHAT_STARTED,
	MESSAGE_TYPE_LIVECHAT_TRANSFER_HISTORY,
} from '../constants';

const renderContent = ({ text, system, quoted, me, blocks, attachments, attachmentResolver, mid, rid }) =>
	[
		...(attachments || []).map(
			(attachment) =>
				(attachment.audio_url && <AudioAttachment quoted={quoted} url={attachmentResolver(attachment.audio_url)} />) ||
				(attachment.video_url && <VideoAttachment quoted={quoted} url={attachmentResolver(attachment.video_url)} />) ||
				(attachment.image_url && <ImageAttachment quoted={quoted} url={attachmentResolver(attachment.image_url)} />) ||
				(attachment.title_link && (
					<FileAttachment quoted={quoted} url={attachmentResolver(attachment.title_link)} title={attachment.title} />
				)) ||
				((attachment.message_link || attachment.tmid) &&
					renderContent({
						text: attachment.text,
						quoted: true,
						attachments: attachment.attachments,
						attachmentResolver,
					})),
		),
		text && (
			<MessageBubble inverse={me} quoted={quoted} system={system}>
				<MessageText text={text} system={system} />
			</MessageBubble>
		),
		blocks && <MessageBlocks blocks={blocks} mid={mid} rid={rid} />,
	].filter(Boolean);

const getSystemMessageText = ({ type, conversationFinishedMessage, transferData, u }, t) =>
	(type === MESSAGE_TYPE_ROOM_NAME_CHANGED && t('room_name_changed')) ||
	(type === MESSAGE_TYPE_USER_ADDED && t('user_added_by')) ||
	(type === MESSAGE_TYPE_USER_REMOVED && t('user_removed_by')) ||
	(type === MESSAGE_TYPE_USER_JOINED && t('user_joined')) ||
	(type === MESSAGE_TYPE_USER_LEFT && t('user_left')) ||
	(type === MESSAGE_TYPE_WELCOME && t('welcome')) ||
	(type === MESSAGE_TYPE_LIVECHAT_CLOSED && (conversationFinishedMessage || t('conversation_finished'))) ||
	(type === MESSAGE_TYPE_LIVECHAT_STARTED && t('chat_started')) ||
	(type === MESSAGE_TYPE_LIVECHAT_TRANSFER_HISTORY && normalizeTransferHistoryMessage(transferData, u, t));

const getMessageUsernames = (compact, message) => {
	if (compact || !message.u) {
		return [];
	}

	const {
		alias,
		u: { username, name },
	} = message;
	if (alias && name) {
		return [name];
	}

	return [username];
};

const Message = ({
	avatarResolver,
	attachmentResolver = getAttachmentUrl,
	use,
	me,
	compact,
	className,
	style = {},
	t,
	hideAvatar,
	...message
}) => {
	const renderedMessage = message.type ? message : prepareMessageForAutoTranslate(message);

	return (
		<MessageContainer
			id={renderedMessage._id}
			compact={compact}
			reverse={me}
			use={use}
			className={className}
			style={style}
			system={!!renderedMessage.type}
		>
			{!renderedMessage.type && !hideAvatar && (
				<MessageAvatars avatarResolver={avatarResolver} usernames={getMessageUsernames(compact, renderedMessage)} />
			)}
			<MessageContent reverse={me}>
				{renderContent({
					text: renderedMessage.type ? getSystemMessageText(renderedMessage, t) : renderedMessage.msg,
					system: !!renderedMessage.type,
					me,
					attachments: renderedMessage.attachments,
					blocks: renderedMessage.blocks,
					mid: renderedMessage._id,
					rid: renderedMessage.rid,
					attachmentResolver,
				})}
			</MessageContent>

			{!compact && !renderedMessage.type && <MessageTime normal={!me} inverse={me} ts={renderedMessage.ts} />}
		</MessageContainer>
	);
};

export default withTranslation()(memo(Message));
