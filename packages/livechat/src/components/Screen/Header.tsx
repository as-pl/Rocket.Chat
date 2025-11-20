import type { ComponentChildren } from 'preact';
import { useRef } from 'preact/hooks';
import { useTranslation, withTranslation } from 'react-i18next';

import Menu, { PopoverMenu } from '../Menu';
import type { ScreenContextValue } from './ScreenProvider';
import type { Agent } from '../../definitions/agents';
import MinimizeIcon from '../../icons/arrowDown.svg';
import RestoreIcon from '../../icons/arrowUp.svg';
import NotificationsEnabledIcon from '../../icons/bell.svg';
import NotificationsDisabledIcon from '../../icons/bellOff.svg';
import ChangeIcon from '../../icons/change.svg';
import FinishIcon from '../../icons/finish.svg';
import KebabIcon from '../../icons/kebab.svg';
import OpenWindowIcon from '../../icons/newWindow.svg';
import RemoveIcon from '../../icons/remove.svg';
import Alert from '../Alert';
import { Avatar } from '../Avatar';
import Header from '../Header';
import Tooltip from '../Tooltip';

type ScreenHeaderProps = {
	alerts: { id: string; children: ComponentChildren; [key: string]: unknown }[];
	agent: Agent;
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

	const largeHeader = () => {
		return !!(agent?.email && agent.phone);
	};

	const headerTitle = () => {
		if (agent?.name) {
			return agent.name;
		}

		if (queueInfo?.spot && queueInfo.spot > 0) {
			return t('waiting_queue');
		}

		return title;
	};

	return (
		<Header
			ref={headerRef}
			post={
				<Header.Post isTitle={!!title}>
					{alerts?.map((alert) => (
						<Alert key={alert.id} {...alert} onDismiss={onDismissAlert}>
							{alert.children}
						</Alert>
					))}
				</HeaderPost>
			}
			large={largeHeader()}
		>
			{agent?.avatar && (
				<HeaderPicture>
					<Avatar src={agent.avatar.src} description={agent.avatar.description} status={agent.status} large={largeHeader()} />
				</HeaderPicture>
			)}

			<Header.Content>
				<Header.Title>{headerTitle()}</Header.Title>
				{agent?.email && <Header.SubTitle>{agent.email}</Header.SubTitle>}
				{agent?.phone && <Header.CustomField>{agent.phone}</Header.CustomField>}
			</Header.Content>

			<Tooltip.Container>
				<Header.Actions>
					{/* {title && (
						<Tooltip.Trigger content={notificationsEnabled ? t('sound_is_on') : t('sound_is_off')} placement='bottom-left'>
							<Header.Action
								aria-label={notificationsEnabled ? t('disable_notifications') : t('enable_notifications')}
								onClick={notificationsEnabled ? onDisableNotifications : onEnableNotifications}
							>
								{notificationsEnabled ? (
									<NotificationsEnabledIcon width={20} height={20} />
								) : (
									<NotificationsDisabledIcon width={20} height={20} />
								)}
							</Header.Action>
						</Tooltip.Trigger>
					)} */}

					{title && (
						<Tooltip.Trigger content={t('options')} placement='bottom-left'>
							<PopoverMenu
								trigger={(pop) => (
									<Header.Action aria-label={t('options')} onClick={pop.pop}>
										<KebabIcon width={20} height={20} />
									</Header.Action>
								)}
								overlayed
							>
								<Menu.Group>
									<Menu.Item
										onClick={notificationsEnabled ? onDisableNotifications : onEnableNotifications}
										icon={notificationsEnabled ? NotificationsEnabledIcon : NotificationsDisabledIcon}
									>
										{notificationsEnabled ? t('disable_notifications') : t('enable_notifications')}
									</Menu.Item>

									{!hideExpandChat && !expanded && !windowed && (
										<Menu.Item onClick={onOpenWindow} icon={OpenWindowIcon}>
											{t('expand_chat')}
										</Menu.Item>
									)}

									{onChangeDepartment && (
										<Menu.Item onClick={onChangeDepartment} icon={ChangeIcon}>
											{t('change_department')}
										</Menu.Item>
									)}

									{onRemoveUserData && (
										<Menu.Item onClick={onRemoveUserData} icon={RemoveIcon}>
											{t('forget_remove_my_data')}
										</Menu.Item>
									)}
									{onFinishChat && (
										<Menu.Item danger onClick={onFinishChat} icon={FinishIcon}>
											{t('finish_this_chat')}
										</Menu.Item>
									)}
								</Menu.Group>
							</PopoverMenu>
						</Tooltip.Trigger>
					)}

					{/** Open in window */}
					{/* {!hideExpandChat && !expanded && !windowed && (
						<Tooltip.Trigger content={t('expand_chat')} placement='bottom-left'>
							<Header.Action aria-label={t('expand_chat')} onClick={onOpenWindow}>
								<OpenWindowIcon width={20} height={20} />
							</Header.Action>
						</Tooltip.Trigger>
					)} */}

					{/** minimize chat */}
					{(expanded || !windowed) && (
						<TooltipTrigger content={minimized ? t('restore_chat') : t('minimize_chat')}>
							<HeaderAction aria-label={minimized ? t('restore_chat') : t('minimize_chat')} onClick={minimized ? onRestore : onMinimize}>
								{minimized ? <RestoreIcon width={20} height={20} /> : <MinimizeIcon width={20} height={20} />}
							</HeaderAction>
						</TooltipTrigger>
					)}
				</Header.Actions>
			</Tooltip.Container>
		</Header>
	);
};

export default withTranslation()(ScreenHeader);
