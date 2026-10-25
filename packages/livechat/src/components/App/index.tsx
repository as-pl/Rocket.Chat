import i18next from 'i18next';
import { Suspense } from 'preact/compat';
import { useEffect } from 'preact/hooks';
import { parse } from 'query-string';
import { I18nextProvider } from 'react-i18next';

import App from './App';
import SDKProvider from '../../providers/SDKProvider';
import ServerProvider from '../../providers/ServerProvider';
import { Provider as StoreProvider, Consumer as StoreConsumer } from '../../store';

// AS-PL customization: HMR connects to the backend selected by the monorepo launcher.
const serverURL =
	window.SERVER_URL ??
	parse(window.location.search).serverUrl ??
	(process.env.NODE_ENV === 'development' ? process.env.ROCKET_CHAT_URL : null);

const AppConnector = () => {
	useEffect(() => {
		void import('../../i18next');
	}, []);

	return (
		<div id='app'>
			<Suspense fallback={null}>
				<I18nextProvider i18n={i18next}>
					<StoreProvider>
						<SDKProvider serverURL={serverURL}>
							<ServerProvider serverURL={serverURL}>
								<StoreConsumer>
									{({
										config,
										user,
										triggered,
										gdpr,
										sound,
										undocked,
										minimized = true,
										expanded = false,
										alerts,
										modal,
										dispatch,
										iframe,
									}) => (
										<App
											config={config}
											gdpr={gdpr}
											triggered={triggered}
											user={user}
											sound={sound}
											undocked={undocked}
											minimized={minimized}
											expanded={expanded}
											alerts={alerts}
											modal={modal}
											dispatch={dispatch}
											iframe={iframe}
										/>
									)}
								</StoreConsumer>
							</ServerProvider>
						</SDKProvider>
					</StoreProvider>
				</I18nextProvider>
			</Suspense>
		</div>
	);
};
export default AppConnector;
