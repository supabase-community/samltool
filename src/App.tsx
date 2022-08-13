import "react";

import "./App.css";

import { useProviders, Providers } from "./Providers";

import NotFound from "./Pages/NotFound";
import Home from "./Pages/Home";
import SSO from "./Pages/SSO";
import SLO from "./Pages/SLO";

const match = (a: URL, b: URL) => {
	if (a.origin === b.origin && a.pathname === b.pathname) {
		let notMatched = 0;

		a.searchParams.forEach((v, k) => {
			if (b.searchParams.get(k) !== v) {
				notMatched += 1;
			}
		});

		return notMatched === 0;
	}

	return false;
};

const App = () => {
	const providers = useProviders();

	const location = new URL(window.location.href);
	const locationHref = location.href;

	const ssoURLs = providers.providers.map((x) => new URL(x.ssoURL));
	const sloURLs = providers.providers.map((x) => new URL(x.sloURL));

	const ssoProviderIndex =
		location.pathname !== "/"
			? ssoURLs.findIndex((x) => match(x, location))
			: -1;
	const sloProviderIndex =
		location.pathname !== "/"
			? sloURLs.findIndex((x) => match(x, location))
			: -1;

	const ssoProvider =
		ssoProviderIndex > -1 ? providers.providers[ssoProviderIndex] : null;
	const sloProvider =
		sloProviderIndex > -1 ? providers.providers[sloProviderIndex] : null;

	return (
		<Providers.Provider value={providers}>
			{ssoProvider ? (
				<SSO key={locationHref} provider={ssoProvider} />
			) : sloProvider ? (
				<SLO key={locationHref} provider={sloProvider} />
			) : location.pathname === "/" ? (
				<Home />
			) : (
				<NotFound />
			)}
		</Providers.Provider>
	);
};

export default App;
