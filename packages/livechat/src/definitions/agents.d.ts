// TODO: Fully type agents in livechat
export type Agent = {
	_id: string;
	username: string;
	name?: string;
	status?: string;
	email?: string;
	phone?: string;
	username: string;
	avatar?: {
		description: string;
		// AS-PL customization: the shared avatar resolver returns null when avatars are disabled.
		src: string | null;
	};
	ts: number;
	[key: string]: unknown;
};
