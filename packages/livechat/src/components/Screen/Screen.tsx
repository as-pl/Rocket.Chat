import { useContext, useLayoutEffect } from 'preact/hooks';

import { createClassName } from '../../helpers/createClassName';
import CloseIcon from '../../icons/close.svg';
import { Button } from '../Button';
import { PopoverContainer } from '../Popover';
import { Sound } from '../Sound';
import { ChatButton } from './ChatButton';
import CssVar from './CssVar';
import ScreenHeader from './Header';
import { ScreenContext } from './ScreenProvider';
import styles from './styles.scss';

export const Screen = ({
	title,
	color,
	agent,
	children,
	className,
	unread,
	triggered = false,
	queueInfo,
	onSoundStop,
	onChangeDepartment,
	onFinishChat,
	onRemoveUserData,
}) => {
	const {
		theme,
		notificationsEnabled,
		minimized = false,
		expanded = false,
		windowed = false,
		alerts,
		modal,
		sound,
		onDismissAlert,
		onEnableNotifications,
		onDisableNotifications,
		onMinimize,
		onRestore,
		onOpenWindow,
		dismissNotification,
		wasMinimized,
		setWasMinimized,
	} = useContext(ScreenContext);
	// const [animateOpen, setAnimateOpen] = useState(false);

	useLayoutEffect(() => {
		if (wasMinimized && !minimized) {
			const timeout = setTimeout(() => setWasMinimized(false), 400);
			return () => clearTimeout(timeout);
		}
	}, [minimized, wasMinimized, setWasMinimized]);

	return (
		<div
			className={createClassName(styles, 'screen', {
				minimized,
				expanded,
				windowed,
				triggered,
				'position-left': theme.position === 'left',
				'animate-open': wasMinimized,
			})}
		>
			<CssVar theme={{ ...theme, color: color || theme.color }} />
			{triggered && (
				<Button onClick={onMinimize} className={createClassName(styles, 'screen__chat-close-button')} icon={<CloseIcon />}>
					Close
				</Button>
			)}
			<div className={createClassName(styles, 'screen__inner', { fitTextSize: triggered }, [className])}>
				<PopoverContainer>
					{!triggered && (
						<ScreenHeader
							alerts={alerts}
							agent={agent}
							title={title}
							notificationsEnabled={notificationsEnabled}
							minimized={minimized}
							expanded={expanded}
							windowed={windowed}
							onDismissAlert={onDismissAlert}
							onEnableNotifications={onEnableNotifications}
							onDisableNotifications={onDisableNotifications}
							onMinimize={onMinimize}
							onRestore={onRestore}
							onOpenWindow={onOpenWindow}
							queueInfo={queueInfo}
							hideExpandChat={theme.hideExpandChat}
							onChangeDepartment={onChangeDepartment}
							onFinishChat={onFinishChat}
							onRemoveUserData={onRemoveUserData}
						/>
					)}

					{modal}
					{children}
				</PopoverContainer>
			</div>

			<ChatButton
				triggered={triggered}
				text={title}
				badge={unread}
				minimized={minimized}
				className={createClassName(styles, 'screen__chat-button')}
				onClick={minimized ? onRestore : onMinimize}
			/>

			{sound && <Sound src={sound.src} play={sound.play} onStop={onSoundStop} dismissNotification={dismissNotification} />}
		</div>
	);
};

export default Screen;
