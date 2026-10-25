import i18next from 'i18next';
import { route } from 'preact-router';
import { useTranslation } from 'react-i18next';

import styles from './styles.scss';
import { Button } from '../../components/Button';
import { Screen, ScreenContent, ScreenFooter } from '../../components/Screen';
import { createClassName } from '../../helpers/createClassName';
import ChangeIcon from '../../icons/change.svg';
import { normalizeLivechatLanguage } from '../../lib/locale';
import Triggers from '../../lib/triggers';
import { useStore } from '../../store';

export type ChatFinishedProps = {
	path?: string;
};

const ChatFinished = (_: ChatFinishedProps) => {
	const { t } = useTranslation();
	const { config: { messages: { conversationFinishedMessage: greeting, conversationFinishedText: message } = {} } = {} } = useStore();

	const defaultGreeting = t('thanks_for_talking_with_us');
	const defaultMessage = t('if_you_have_any_other_questions_just_press_the_but');
	const {
		iframe: { language: pageLanguage },
		dispatch,
	} = useStore();
	const handleClick = () => {
		// AS-PL customization: a new conversation must repeat the visitor language choice.
		dispatch({ conversationLanguage: undefined, languageSelectionConfirmed: undefined });
		void i18next.changeLanguage(normalizeLivechatLanguage(pageLanguage || 'en'));
		route('/');
		Triggers.callbacks?.emit('chat-visitor-registered');
	};

	return (
		<Screen title='' className={createClassName(styles, 'chat-finished')}>
			<ScreenContent>
				<div className={createClassName(styles, 'chat-finished__container')}>
					<p className={createClassName(styles, 'chat-finished__greeting')}>{greeting || defaultGreeting}</p>
					<p className={createClassName(styles, 'chat-finished__message')}>{message || defaultMessage}</p>
				</div>
			</ScreenContent>
			<ScreenFooter>
				<Button nude onClick={handleClick} className={createClassName(styles, 'chat-finished__new-chat')}>
					<ChangeIcon width={12} height={12} />
					{t('new_chat')}
				</Button>
			</ScreenFooter>
		</Screen>
	);
};

export default ChatFinished;
