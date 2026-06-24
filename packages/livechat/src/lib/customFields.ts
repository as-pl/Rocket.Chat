import { Livechat } from '../api';
import type { StoreState } from '../store';
import store from '../store';

class CustomFields {
	static instance: CustomFields;

	private _initiated = false;

	private _started = false;

	private _processedRoomId?: string;

	private _customFields: StoreState['customFieldsQueue'] = {};

	constructor() {
		if (!CustomFields.instance) {
			CustomFields.instance = this;
		}

		return CustomFields.instance;
	}

	init() {
		if (this._initiated) {
			return;
		}

		this._initiated = true;
		const { token } = store.state;
		Livechat.token = token;

		store.on('change', this.handleStoreChange);
	}

	reset() {
		this._initiated = false;
		this._started = false;
		this._processedRoomId = undefined;
		this._customFields = {};
		store.off('change', this.handleStoreChange);
	}

	handleStoreChange([state]: [StoreState]) {
		const { user, room } = state;
		const instance = CustomFields.instance;
		const roomId = room?._id;

		if (!user) {
			return;
		}

		if (!instance._started) {
			instance._started = true;
			instance.processCustomFields();

			if (roomId) {
				instance._processedRoomId = roomId;
			}

			return;
		}

		if (!roomId || instance._processedRoomId === roomId) {
			return;
		}

		instance._processedRoomId = roomId;
		instance.processCustomFields();
	}

	addToQueue(key: string, value: string, overwrite: boolean) {
		const { customFieldsQueue } = store.state;
		store.setState({
			customFieldsQueue: {
				...customFieldsQueue,
				[key]: { value, overwrite },
			},
		});
	}

	getQueue() {
		return store.state.customFieldsQueue;
	}

	clearQueue() {
		store.setState({ customFieldsQueue: {} });
	}

	processCustomFields() {
		const customFields = { ...this.getQueue(), ...this._customFields };
		this._customFields = customFields;

		Object.entries(customFields).forEach(([key, { value, overwrite }]) => {
			this.sendCustomField(key, value, overwrite);
		});

		this.clearQueue();
	}

	sendCustomField(key: string, value: string, overwrite: boolean) {
		const { token } = Livechat;
		if (!token) {
			return;
		}

		void Livechat.sendCustomField({ token, key, value, overwrite }).catch((error) => {
			console.warn('Failed to set livechat custom field', error);
		});
	}

	setCustomField(key: string, value: string, overwrite = true) {
		this._customFields[key] = { value, overwrite };

		if (!this._started) {
			this.addToQueue(key, value, overwrite);
			return;
		}

		this.sendCustomField(key, value, overwrite);
	}
}

const instance = new CustomFields();
export default instance;
