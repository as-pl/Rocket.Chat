import type { ReactElement } from 'react';

import { useLicense, useLicenseName } from '../../hooks/useLicense';
import { links } from '../../lib/links';

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
