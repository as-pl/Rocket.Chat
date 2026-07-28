import { withTranslation } from 'react-i18next';

import styles from './styles.scss';
import { Button } from '../../components/Button';
import { Screen, ScreenContent, ScreenFooter } from '../../components/Screen';
import { createClassName } from '../../helpers/createClassName';
import ChangeIcon from '../../icons/change.svg';
import Triggers from '../../lib/triggers';

type ChatFinishedProps = {
	title: string;
	greeting?: string;
	message?: string;
	onRedirectChat?: () => void;
	t: (s: string) => string;
};

const ChatFinished = ({ greeting, message, onRedirectChat, t }: ChatFinishedProps) => {
	const handleClick = () => {
		onRedirectChat?.();
		Triggers.callbacks?.emit('chat-visitor-registered');
	};

	const defaultGreeting = t('thanks_for_talking_with_us');
	const defaultMessage = t('if_you_have_any_other_questions_just_press_the_but');

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

export default withTranslation()(ChatFinished);
