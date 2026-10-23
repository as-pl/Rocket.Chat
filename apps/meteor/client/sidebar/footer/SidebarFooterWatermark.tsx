// AS-PL customization: retain the fork footer while restoring the license hooks needed to render it safely.
import { useLicense, useLicenseName } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';

export const SidebarFooterWatermark = (): ReactElement | null => {
	const response = useLicense();

	const licenseName = useLicenseName();

	if (response.isLoading || response.isError) {
		return null;
	}

	if (licenseName.isError || licenseName.isLoading) {
		return null;
	}

	const license = response.data;

	if (license?.activeModules.includes('hide-watermark') && !license.trial) {
		return null;
	}

	return <></>;
};
