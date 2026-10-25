import { useCallback, useRef, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { useTranslation } from 'react-i18next';

import ChatContent from './ChatContent';
import ChatFooter from './ChatFooter';
import styles from './styles.scss';
import { useChatEffects } from './useChatEffects';
import { useChatSubscriptions } from './useChatSubscriptions';
import { useStableCallback } from './useStableCallback';
import { Livechat } from '../../api';
import { FilesDropTarget } from '../../components/FilesDropTarget';
import { ModalManager } from '../../components/Modal';
import { Screen } from '../../components/Screen';
import { canRenderMessage } from '../../helpers/canRenderMessage';
import { createClassName } from '../../helpers/createClassName';
import { formatAgent } from '../../helpers/formatAgent';
import { useChatLanguageAction } from '../../hooks/useChatLanguageAction';
import { loadConfig } from '../../lib/main';
import { parentCall, runCallbackEventEmitter } from '../../lib/parentCall';
import { createToken } from '../../lib/random';
import { defaultRoomParams, getGreetingMessages, initRoom } from '../../lib/room';
import { useStore } from '../../store';

const useChatTitle = () => {
	const {
		iframe: { theme: { title: customTitle = '' } = {} },
	} = useStore();

	return customTitle;
};

export type ChatProps = {
	path?: string;
	default?: boolean;
};

const Chat = (_: ChatProps) => {
	useChatEffects();
	useChatSubscriptions();

	const {
		config: {
			settings: {
				fileUpload: uploads,
				allowSwitchingDepartments,
				visitorsCanCloseChat,
				forceAcceptDataProcessingConsent,
				showConnecting,
				registrationForm,
				nameFieldRegistrationForm,
				emailFieldRegistrationForm,
			},
			departments = [],
		},
		iframe: { guest = {}, defaultDepartment },
		token,
		agent,
		sound,
		user,
		room,
		dispatch,
		alerts,
		unread,
		queueInfo,
	} = useStore();

	const { t } = useTranslation();

	const inputRef = useRef<HTMLInputElement>(null);
	const notifyEmojiSelectRef = useRef<(native: string) => void>();
	// AS-PL customization: keep the Expert Desk title and shared language switch.
	const languageAction = useChatLanguageAction();
	const title = useChatTitle() || t('livechat_title');
	const messages = useStore().messages?.filter(canRenderMessage);
	// AS-PL customization: share the registration gate between the pre-chat greeting and composer.
	const registrationRequired =
		!user?.token &&
		!!registrationForm &&
		!!(nameFieldRegistrationForm || emailFieldRegistrationForm || departments.some((dept) => dept.showOnRegistration));

	const grantUser = useStableCallback(async () => {
		if (user) {
			return;
		}

		if (!guest?.department && defaultDepartment && guest) {
			guest.department = defaultDepartment;
		}

		const visitor = { token, ...guest };
		const { visitor: newUser } = await Livechat.grantVisitor({ visitor });
		dispatch({ user: newUser });
	});

	const getRoom = useStableCallback(async () => {
		const previousMessages = getGreetingMessages(messages);

		if (room) {
			return room;
		}

		dispatch({ loading: true });
		try {
			const params = defaultRoomParams();
			const newRoom = await Livechat.room(params as Parameters<typeof Livechat.room>[0]);
			dispatch({ room: newRoom, messages: previousMessages, noMoreMessages: false });
			await initRoom();

			parentCall('callback', 'chat-started');
			return newRoom;
		} catch (error: any) {
			const reason = error ? error.error : '';
			const alert = {
				id: createToken(),
				children: t('error_starting_a_new_conversation_reason', { reason }),
				error: true,
				timeout: 10000,
			};
			dispatch({ loading: false, alerts: (alerts.push(alert), alerts) });

			runCallbackEventEmitter(reason, undefined);
			throw error;
		} finally {
			dispatch({ loading: false });
		}
	});

	const queryRoomId = useCallback(async () => {
		await grantUser();
		const { _id: rid } = await getRoom();
		return rid;
	}, [grantUser, getRoom]);

	const doFileUpload = useStableCallback(async (rid: string, file: File) => {
		try {
			await Livechat.uploadFile(rid, file);
		} catch (error: any) {
			const {
				data: { reason, sizeAllowed },
			} = error;

			let message = t('fileupload_error');
			switch (reason) {
				case 'error-type-not-allowed':
					message = t('media_types_not_accepted');
					break;
				case 'error-size-not-allowed':
					message = t('file_exceeds_allowed_size_of_size', { size: sizeAllowed });
			}

			const alert = { id: createToken(), children: message, error: true, timeout: 5000 };
			dispatch({ alerts: (alerts.push(alert), alerts) });
		}
	});

	const handleUpload = useStableCallback(async (files: (File | null)[]) => {
		if (!uploads) {
			const alert = { id: createToken(), children: t('file_upload_disabled'), error: true, timeout: 5000 };
			dispatch({ alerts: (alerts.push(alert), alerts) });
			return;
		}

		const rid = await queryRoomId();

		files.forEach((file) => {
			if (file) {
				void doFileUpload(rid, file);
			}
		});
	});

	const handleSoundStop = useStableCallback(async () => {
		dispatch({ sound: { ...sound, play: false } });
	});

	// AS-PL customization: conversation controls stay in the Expert Desk header after upstream split the chat route.
	const handleChangeDepartment = useCallback(() => {
		route('/switch-department');
	}, []);
	const connecting = !!(room && !agent && (showConnecting || queueInfo));
	const handleFinishChat = useStableCallback(async () => {
		const { success } = await ModalManager.confirm({
			text: t('are_you_sure_you_want_to_finish_this_chat'),
		});

		if (!success) {
			return;
		}

		const { _id: rid } = room || {};

		dispatch({ loading: true });
		try {
			if (!rid) {
				throw new Error('error-room-not-found');
			}

			await Livechat.closeChat({ rid });
		} catch (error) {
			console.error(error);
			const alert = { id: createToken(), children: t('error_closing_chat'), error: true, timeout: 0 };
			dispatch({ alerts: (alerts.push(alert), alerts) });
		} finally {
			dispatch({ loading: false });
		}
	});

	const handleRemoveUserData = useStableCallback(async () => {
		const { success } = await ModalManager.confirm({
			text: t('are_you_sure_you_want_to_remove_all_of_your_person'),
		});

		if (!success) {
			return;
		}

		dispatch({ loading: true });
		try {
			await Livechat.deleteVisitor();
		} catch (error) {
			console.error(error);
			const alert = { id: createToken(), children: t('error_removing_user_data'), error: true, timeout: 0 };
			dispatch({ alerts: (alerts.push(alert), alerts) });
		} finally {
			await loadConfig();
			dispatch({ loading: false });
			route('/chat-finished');
		}
	});

	const canSwitchDepartment = !!allowSwitchingDepartments && departments.filter((dept) => dept.showOnRegistration).length > 1;

	const canFinishChat = !!visitorsCanCloseChat && (room?._id !== undefined || !!connecting);

	const canRemoveUserData = !!forceAcceptDataProcessingConsent;

	const [emojiPickerActive, setEmojiPickerActive] = useState(false);

	const handleAddAttachment = useCallback(() => {
		inputRef.current?.click();
	}, []);

	const handleToggleEmojiPicker = useCallback(() => {
		setEmojiPickerActive((emojiPickerActive) => !emojiPickerActive);
	}, []);

	const handleDismissEmojiPicker = useCallback(() => {
		setEmojiPickerActive(false);
	}, []);

	return (
		<Screen
			languageAction={languageAction}
			onChangeDepartment={canSwitchDepartment ? handleChangeDepartment : undefined}
			onFinishChat={canFinishChat ? handleFinishChat : undefined}
			onRemoveUserData={canRemoveUserData ? handleRemoveUserData : undefined}
			title={title || t('need_help')}
			agent={formatAgent(agent)}
			queueInfo={queueInfo}
			className={createClassName(styles, 'chat')}
			unread={unread}
			onSoundStop={handleSoundStop}
		>
			<FilesDropTarget inputRef={inputRef} overlayed overlayText={t('drop_here_to_upload_a_file')} onUpload={handleUpload}>
				<ChatContent
					registrationRequired={registrationRequired}
					notifyEmojiSelectRef={notifyEmojiSelectRef}
					emojiPickerActive={emojiPickerActive}
					onToggleEmojiPicker={handleToggleEmojiPicker}
					onDismissEmojiPicker={handleDismissEmojiPicker}
				/>
				<ChatFooter
					registrationRequired={registrationRequired}
					notifyEmojiSelectRef={notifyEmojiSelectRef}
					onToggleEmojiPicker={handleToggleEmojiPicker}
					onDismissEmojiPicker={handleDismissEmojiPicker}
					onAddAttachment={handleAddAttachment}
					onUpload={handleUpload}
					queryRoomId={queryRoomId}
				/>
			</FilesDropTarget>
		</Screen>
	);
};

export default Chat;
