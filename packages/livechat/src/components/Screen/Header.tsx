import type { ComponentChildren } from 'preact';
import { useRef } from 'preact/hooks';
import { useTranslation, withTranslation } from 'react-i18next';

import styles from './styles.scss';
import { MenuGroup, MenuItem, MenuPopover } from '../Menu';
import type { ScreenContextValue } from './ScreenProvider';
import type { Agent } from '../../definitions/agents';
import { createClassName } from '../../helpers/createClassName';
import RestoreIcon from '../../icons/arrowUp.svg';
import NotificationsEnabledIcon from '../../icons/bell.svg';
import NotificationsDisabledIcon from '../../icons/bellOff.svg';
import ChangeIcon from '../../icons/change.svg';
import CloseIcon from '../../icons/close.svg';
import FinishIcon from '../../icons/finish.svg';
import KebabIcon from '../../icons/kebab.svg';
import OpenWindowIcon from '../../icons/newWindow.svg';
import RemoveIcon from '../../icons/remove.svg';
import Alert from '../Alert';
import { Header, HeaderAction, HeaderActions, HeaderContent, HeaderPicture, HeaderPost, HeaderSubTitle, HeaderTitle } from '../Header';
import { TooltipContainer, TooltipTrigger } from '../Tooltip';

type ScreenHeaderProps = {
	alerts: { id: string; children: ComponentChildren; [key: string]: unknown }[];
	agent?: Agent | null;
	notificationsEnabled: boolean;
	minimized: boolean;
	expanded: boolean;
	windowed: boolean;
	onDismissAlert?: (id?: string) => void;
	onEnableNotifications: () => unknown;
	onDisableNotifications: () => unknown;
	onMinimize: () => unknown;
	onRestore: ScreenContextValue['onRestore'];
	onOpenWindow: () => unknown;
	queueInfo: {
		spot: number;
	};
	title: string;
	hideExpandChat: boolean;
	onChangeDepartment: any;
	onFinishChat: any;
	onRemoveUserData: any;
};

const ScreenHeader = ({
	alerts,
	agent,
	notificationsEnabled,
	minimized,
	expanded,
	windowed,
	onDismissAlert,
	onEnableNotifications,
	onDisableNotifications,
	onMinimize,
	onRestore,
	onOpenWindow,
	queueInfo,
	title,
	hideExpandChat,
	onChangeDepartment,
	onFinishChat,
	onRemoveUserData,
}: ScreenHeaderProps) => {
	const { t } = useTranslation();
	const headerRef = useRef<HTMLElement>(null);

	const headerTitle = () => {
		return title || t('livechat_title');
	};

	const waiting = !!(queueInfo?.spot && queueInfo.spot > 0);
	const offline = agent?.status === 'offline';
	const getStatus = () => {
		if (waiting) {
			return t('waiting_queue');
		}

		if (offline) {
			return t('livechat_is_not_connected');
		}

		if (agent) {
			return t('livechat_connected');
		}

		return t('please_wait_for_the_next_available_agent');
	};
	const status = getStatus();

	return (
		<Header
			ref={headerRef}
			post={
				<HeaderPost>
					{alerts?.map((alert) => (
						<Alert key={alert.id} {...alert} onDismiss={onDismissAlert}>
							{alert.children}
						</Alert>
					))}
				</HeaderPost>
			}
			large={false}
		>
			<HeaderPicture>
				<span className={createClassName(styles, 'screen__brand-mark')} aria-hidden='true'>
					AS
				</span>
			</HeaderPicture>

			<HeaderContent>
				<HeaderTitle>{headerTitle()}</HeaderTitle>
				<HeaderSubTitle>
					<span className={createClassName(styles, 'screen__status')}>
						<span className={createClassName(styles, 'screen__status-dot', { waiting, offline })} aria-hidden='true' />
						<span className={createClassName(styles, 'screen__status-copy')}>
							{t('as_pl_support_team')} · {status}
						</span>
					</span>
				</HeaderSubTitle>
			</HeaderContent>

			<TooltipContainer>
				<HeaderActions>
					{/* {title && (
						<TooltipTrigger content={notificationsEnabled ? t('sound_is_on') : t('sound_is_off')} placement='bottom-left'>
							<HeaderAction
								aria-label={notificationsEnabled ? t('disable_notifications') : t('enable_notifications')}
								onClick={notificationsEnabled ? onDisableNotifications : onEnableNotifications}
							>
								{notificationsEnabled ? (
									<NotificationsEnabledIcon width={20} height={20} />
								) : (
									<NotificationsDisabledIcon width={20} height={20} />
								)}
							</HeaderAction>
						</TooltipTrigger>
					)} */}

					{title && (
						<TooltipTrigger content={t('options')} placement='bottom-left'>
							<MenuPopover
								trigger={(pop) => (
									<HeaderAction aria-label={t('options')} onClick={pop.pop}>
										<KebabIcon width={20} height={20} />
									</HeaderAction>
								)}
								overlayed
							>
								<MenuGroup>
									<MenuItem
										onClick={notificationsEnabled ? onDisableNotifications : onEnableNotifications}
										icon={notificationsEnabled ? NotificationsEnabledIcon : NotificationsDisabledIcon}
									>
										{notificationsEnabled ? t('disable_notifications') : t('enable_notifications')}
									</MenuItem>

									{!hideExpandChat && !expanded && !windowed && (
										<MenuItem onClick={onOpenWindow} icon={OpenWindowIcon}>
											{t('expand_chat')}
										</MenuItem>
									)}

									{onChangeDepartment && (
										<MenuItem onClick={onChangeDepartment} icon={ChangeIcon}>
											{t('change_department')}
										</MenuItem>
									)}

									{onRemoveUserData && (
										<MenuItem onClick={onRemoveUserData} icon={RemoveIcon}>
											{t('forget_remove_my_data')}
										</MenuItem>
									)}
									{onFinishChat && (
										<MenuItem danger onClick={onFinishChat} icon={FinishIcon}>
											{t('finish_this_chat')}
										</MenuItem>
									)}
								</MenuGroup>
							</MenuPopover>
						</TooltipTrigger>
					)}

					{!hideExpandChat && !expanded && !windowed && (
						<TooltipTrigger content={t('expand_chat')} placement='bottom-left'>
							<HeaderAction aria-label={t('expand_chat')} onClick={onOpenWindow}>
								<OpenWindowIcon width={20} height={20} />
							</HeaderAction>
						</TooltipTrigger>
					)}

					{/** minimize chat */}
					{(expanded || !windowed) && (
						<TooltipTrigger content={minimized ? t('restore_chat') : t('minimize_chat')}>
							<HeaderAction aria-label={minimized ? t('restore_chat') : t('minimize_chat')} onClick={minimized ? onRestore : onMinimize}>
								{minimized ? <RestoreIcon width={20} height={20} /> : <CloseIcon width={20} height={20} />}
							</HeaderAction>
						</TooltipTrigger>
					)}
				</HeaderActions>
			</TooltipContainer>
		</Header>
	);
};

export default withTranslation()(ScreenHeader);
