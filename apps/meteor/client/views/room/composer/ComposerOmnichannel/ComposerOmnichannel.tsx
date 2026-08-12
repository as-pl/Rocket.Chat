import { MessageFooterCallout } from '@rocket.chat/ui-composer';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useIsRoomOverMacLimit } from '../../../omnichannel/hooks/useIsRoomOverMacLimit';
import { useOmnichannelRoom, useUserIsSubscribed } from '../../contexts/RoomContext';
import type { ComposerMessageProps } from '../ComposerMessage';
import ComposerMessage from '../ComposerMessage';
import { ComposerOmnichannelInquiry } from './ComposerOmnichannelInquiry';
import { ComposerOmnichannelJoin } from './ComposerOmnichannelJoin';
import { ComposerOmnichannelOnHold } from './ComposerOmnichannelOnHold';

const ComposerOmnichannel = (props: ComposerMessageProps) => {
	const { t } = useTranslation();
	const userId = useUserId();
	const room = useOmnichannelRoom();

	const { servedBy, queuedAt, open, onHold } = room;

	const isSubscribed = useUserIsSubscribed();
	const isInquired = !servedBy && queuedAt;
	const isSameAgent = servedBy?._id === userId;
	const isRoomOverMacLimit = useIsRoomOverMacLimit(room);

	// AS-PL customization: anonymous B2B LiveChat visitors are expected, so the upstream unknown-contact callout is intentionally not mounted.
	if (!open) {
		return <MessageFooterCallout color='default'>{t('This_conversation_is_already_closed')}</MessageFooterCallout>;
	}

	if (isRoomOverMacLimit) {
		return <MessageFooterCallout color='default'>{t('Workspace_exceeded_MAC_limit_disclaimer')}</MessageFooterCallout>;
	}

	if (onHold) {
		return <ComposerOmnichannelOnHold />;
	}

	if (isInquired) {
		return <ComposerOmnichannelInquiry />;
	}

	if (!isSubscribed && !isSameAgent) {
		return <ComposerOmnichannelJoin />;
	}

	return <ComposerMessage {...props} />;
};

export default ComposerOmnichannel;
