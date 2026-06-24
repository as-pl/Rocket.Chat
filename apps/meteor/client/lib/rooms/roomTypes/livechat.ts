import type { AtLeast, ValueOf } from '@rocket.chat/core-typings';

import { getAvatarURL } from '../../../../app/utils/client/getAvatarURL';
import type { IRoomTypeClientDirectives } from '../../../../definition/IRoomTypeConfig';
import { RoomSettingsEnum, RoomMemberActions, UiTextContext } from '../../../../definition/IRoomTypeConfig';
import { getLivechatRoomType } from '../../../../lib/rooms/roomTypes/livechat';
import { Rooms, Subscriptions } from '../../../stores';
import { roomCoordinator } from '../roomCoordinator';

const truncateLivechatName = (name: string): string => (name.length > 20 ? name.slice(0, 20) + '...' : name);

const getLivechatDisplayName = (room: { name?: string; fname?: string }): string | undefined => room.name || room.fname || (room as any).label;

const getLivechatWarehouse = (room: { customFields?: Record<string, unknown>; livechatData?: Record<string, unknown> }): string | undefined => {
	const warehouse = room.customFields?.warehouse ?? room.livechatData?.warehouse;

	if (typeof warehouse !== 'string') {
		return;
	}

	const trimmedWarehouse = warehouse.trim();
	return trimmedWarehouse || undefined;
};

export const LivechatRoomType = getLivechatRoomType(roomCoordinator);

roomCoordinator.add(
	{
		...LivechatRoomType,
		label: 'Omnichannel',
	},
	{
		allowRoomSettingChange(_room, setting) {
			switch (setting) {
				case RoomSettingsEnum.JOIN_CODE:
					return false;
				default:
					return true;
			}
		},

		allowMemberAction(_room, action) {
			return ([RoomMemberActions.INVITE, RoomMemberActions.JOIN] as Array<ValueOf<typeof RoomMemberActions>>).includes(action);
		},

		roomName(room) {
			const name = getLivechatDisplayName(room);
			const warehouse = getLivechatWarehouse(room);

			if (!warehouse || !name) {
				return name;
			}

			return '[' + warehouse + '] ' + truncateLivechatName(name);
		},

		getUiText(context) {
			switch (context) {
				case UiTextContext.HIDE_WARNING:
					return 'Hide_Livechat_Warning';
				case UiTextContext.LEAVE_WARNING:
					return 'Leave_Livechat_Warning';
				default:
					return '';
			}
		},

		getAvatarPath(room) {
			const name = getLivechatDisplayName(room);

			if (!name) {
				return '';
			}

			return getAvatarURL({ username: '@' + name }) || '';
		},

		findRoom(identifier) {
			return Rooms.state.get(identifier);
		},

		isLivechatRoom() {
			return true;
		},

		canSendMessage(room) {
			return Boolean(room?.open);
		},

		readOnly(room) {
			if (!room?.open) {
				return true;
			}

			const subscription = Subscriptions.state.find((record) => record.rid === room._id);
			return !subscription;
		},

		getIcon() {
			return 'livechat';
		},

		extractOpenRoomParams({ id }) {
			return { type: 'l', reference: id };
		},
	} as AtLeast<IRoomTypeClientDirectives, 'roomName'>,
);
