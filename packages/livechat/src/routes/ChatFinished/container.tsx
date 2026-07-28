import type { TFunction } from 'i18next';
import i18next from 'i18next';
import { useContext } from 'preact/hooks';
import { route } from 'preact-router';
import { withTranslation } from 'react-i18next';

import ChatFinished from './component';
import { normalizeLivechatLanguage } from '../../lib/locale';
import { StoreContext } from '../../store';

type ChatFinishedContainerProps = {
	ref?: any;
	t: TFunction;
	path: string;
};

const ChatFinishedContainer = ({ ref, t }: ChatFinishedContainerProps) => {
	const {
		config: {
			messages: { conversationFinishedMessage: greeting, conversationFinishedText: message },
		},
		iframe: { language: pageLanguage },
		dispatch,
	} = useContext(StoreContext);

	const handleRedirect = () => {
		dispatch({
			conversationLanguage: undefined,
			languageSelectionConfirmed: undefined,
		});
		void i18next.changeLanguage(normalizeLivechatLanguage(pageLanguage || 'en'));
		route('/');
	};

	return <ChatFinished ref={ref} title={t('chat_finished')} greeting={greeting} message={message} onRedirectChat={handleRedirect} />;
};

export default withTranslation()(ChatFinishedContainer);
