import type { MutableRef } from 'preact/hooks';
import { useCallback, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { useTranslation } from 'react-i18next';

import styles from './styles.scss';
import { useStableCallback } from './useStableCallback';
import { Livechat } from '../../api';
import { Button } from '../../components/Button';
import { Composer, ComposerAction, ComposerActions } from '../../components/Composer';
import { CharCounter } from '../../components/Footer';
import { ScreenFooter } from '../../components/Screen';
import { createClassName } from '../../helpers/createClassName';
import { debounce } from '../../helpers/debounce';
import { throttle } from '../../helpers/throttle';
import PlusIcon from '../../icons/plus.svg';
import SendIcon from '../../icons/send.svg';
import EmojiIcon from '../../icons/smile.svg';
import { createToken } from '../../lib/random';
import { useStore } from '../../store';

const startTyping = throttle(async ({ rid, username }: { rid: string; username: string }) => {
	await Livechat.notifyVisitorActivity(rid, username, ['user-typing']);
	stopTypingDebounced({ rid, username });
}, 4500);

const stopTyping = ({ rid, username }: { rid: string; username: string }) => Livechat.notifyVisitorActivity(rid, username, []);

const stopTypingDebounced = debounce(stopTyping, 5000);

export type ChatFooterProps = {
	registrationRequired: boolean;
	notifyEmojiSelectRef: MutableRef<((native: string) => void) | undefined>;
	onToggleEmojiPicker: () => void;
	onDismissEmojiPicker: () => void;
	onAddAttachment: () => void;
	onUpload: (files: (File | null)[]) => Promise<void>;
	queryRoomId: () => Promise<string>;
};

const ChatFooter = ({
	registrationRequired,
	notifyEmojiSelectRef,
	onToggleEmojiPicker,
	onDismissEmojiPicker,
	onAddAttachment,
	onUpload,
	queryRoomId,
}: ChatFooterProps) => {
	const {
		config: {
			settings: {
				fileUpload,

				limitTextLength = 2000,
			},
		},
		token,

		user,
		room,
		loading,
		dispatch,
		alerts,
	} = useStore();

	const { t } = useTranslation();

	const onRegisterUser = useCallback(() => {
		route('/register');
	}, []);

	const performSubmit = useStableCallback(async (msg: string) => {
		if (msg.trim() === '') {
			return;
		}

		const rid = await queryRoomId();

		try {
			stopTypingDebounced.stop();
			await Promise.all([stopTyping({ rid, username: user?.username ?? '' }), Livechat.sendMessage({ msg, token, rid })]);
		} catch (error: any) {
			const reason = error?.error ?? error.message;
			const alert = { id: createToken(), children: reason, error: true, timeout: 5000 };
			dispatch({ alerts: (alerts.push(alert), alerts) });
		}
		await Livechat.notifyVisitorActivity(rid, user?.username ?? '', []);
	});

	const [msg, setMsg] = useState('');

	const handleSubmit = useStableCallback((text: string) => {
		setMsg('');
		onDismissEmojiPicker();
		void performSubmit(text);
	});

	const handleChangeText = useStableCallback((text: string) => {
		let value = text;
		if (limitTextLength && limitTextLength < text.length) {
			value = value.substring(0, limitTextLength);
		}
		setMsg(value);

		if (!(user?.username && room?._id)) return;
		startTyping({ rid: room._id, username: user.username });
	});

	const handleSendClick = useStableCallback((event?: Event) => {
		event?.preventDefault();
		handleSubmit(msg);
	});

	return (
		<ScreenFooter
			// AS-PL customization: conversation actions live in the Expert Desk header.
			limit={limitTextLength ? <CharCounter limitTextLength={limitTextLength} textLength={msg.length} /> : null}
		>
			{registrationRequired ? (
				<Button loading={loading} disabled={loading} onClick={onRegisterUser} stack>
					{t('chat_now')}
				</Button>
			) : (
				<Composer
					onUpload={onUpload}
					onSubmit={handleSubmit}
					onChange={handleChangeText}
					placeholder={t('type_your_message_here')}
					value={msg}
					notifyEmojiSelect={(click: (native: string) => void) => {
						notifyEmojiSelectRef.current = click;
					}}
					handleEmojiClick={onDismissEmojiPicker}
					pre={
						<ComposerActions>
							<ComposerAction
								text={t('Frequently_Used')}
								className={createClassName(styles, 'emoji-picker-icon')}
								onClick={onToggleEmojiPicker}
							>
								<EmojiIcon width={20} height={20} />
							</ComposerAction>
						</ComposerActions>
					}
					post={
						<ComposerActions>
							{fileUpload && (
								<ComposerAction
									text={t('drop_here_to_upload_a_file')}
									className={createClassName(styles, 'chat__composer-upload')}
									onClick={onAddAttachment}
								>
									<PlusIcon width={20} height={20} />
								</ComposerAction>
							)}
							<ComposerAction
								text={t('send')}
								disabled={msg.length === 0}
								className={createClassName(styles, 'chat__composer-send')}
								onClick={handleSendClick}
							>
								<SendIcon width={20} height={20} />
							</ComposerAction>
						</ComposerActions>
					}
					limitTextLength={limitTextLength}
				/>
			)}
		</ScreenFooter>
	);
};

export default ChatFooter;
