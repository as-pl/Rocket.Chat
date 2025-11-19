import { withTranslation } from 'react-i18next';

import styles from './styles.scss';
import { Button } from '../../components/Button';
import { ButtonGroup } from '../../components/ButtonGroup';
import Screen from '../../components/Screen';
import { createClassName } from '../../helpers/createClassName';
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
		<Screen title={''} className={createClassName(styles, 'chat-finished')}>
			<Screen.Content>
				<div className={createClassName(styles, 'chat-finished__container')}>
					<p className={createClassName(styles, 'chat-finished__greeting')}>{greeting || defaultGreeting}</p>
					<p className={createClassName(styles, 'chat-finished__message')}>{message || defaultMessage}</p>

					<div className={createClassName(styles, 'chat-finished__btn')}>
						<ButtonGroup>
							<Button onClick={handleClick} stack>
								{t('new_chat')}
							</Button>
						</ButtonGroup>
					</div>
				</div>
			</Screen.Content>
			<Screen.Footer />
		</Screen>
	);
};

export default withTranslation()(ChatFinished);
