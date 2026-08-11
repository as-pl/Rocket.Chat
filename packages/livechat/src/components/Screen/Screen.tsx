import type { ComponentChildren, Ref } from 'preact';
import { useContext, useLayoutEffect } from 'preact/hooks';

import type { Agent } from '../../definitions/agents';
import { createClassName } from '../../helpers/createClassName';
import CloseIcon from '../../icons/close.svg';
import { Button } from '../Button';
import { PopoverContainer } from '../Popover';
import { Sound } from '../Sound';
import { ChatButton } from './ChatButton';
import CssVar from './CssVar';
import ScreenHeader, { type LanguageAction } from './Header';
import { ScreenContext } from './ScreenProvider';
import styles from './styles.scss';

type ScreenProps = {
	title?: string;
	color?: string;
	agent?: Partial<Agent> | null;
	children?: ComponentChildren;
	className?: string;
	unread?: number;
	triggered?: boolean;
	queueInfo?: { spot: number };
	onSoundStop?: () => void;
	onChangeDepartment?: () => void;
	onFinishChat?: () => void;
	onRemoveUserData?: () => void;
	languageAction?: LanguageAction;
	ref?: Ref<HTMLDivElement>;
};

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
	languageAction,
	ref,
}: ScreenProps) => {
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

		return undefined;
	}, [minimized, wasMinimized, setWasMinimized]);

	return (
		<div
			ref={ref}
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
							languageAction={languageAction}
						/>
					)}

					{modal}
					{children}
				</PopoverContainer>
			</div>

			<ChatButton
				triggered={triggered}
				text={title || ''}
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
