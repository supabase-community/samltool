import { createContext, useState, useEffect } from "react";

export interface Provider {
	id: string;
	flavor: string;
	name: string;
	entityID: string;
	cert: string;
	metadata: string;
	privateKey: string;
	ssoURL: string;
	sloURL: string;
	notBefore: string;
	notAfter: string;
	serviceProviders: {
		[entityID: string]: {
			name: string;
			entityID: string;
			acsURL: string;
			signingCert: string;
			signedRequests: boolean;
		};
	};
}

export const emptyProvider = () => {
	return {
		id: "",
		flavor: "",
		name: "",
		entityID: "",
		cert: "",
		metadata: "",
		privateKey: "",
		ssoURL: "",
		sloURL: "",
		notBefore: "",
		notAfter: "",
		serviceProviders: {},
	};
};

const loadProviders = () => {
	const ids = JSON.parse(
		window.localStorage.getItem("identityProviders") || "[]"
	) as string[];

	return ids.map(
		(id) =>
			JSON.parse(
				window.localStorage.getItem(`identityProvider:${id}`)!
			) as Provider
	);
};

const storeProviders = (providers: Provider[]) => {
	window.localStorage.setItem(
		"identityProviders",
		JSON.stringify(providers.map((provider) => provider.id))
	);
};

const addProvider = (providers: Provider[], provider: Provider) => {
	window.localStorage.setItem(
		`identityProvider:${provider.id}`,
		JSON.stringify(provider)
	);

	const newProviders = [...providers, provider];
	storeProviders(newProviders);

	return newProviders;
};

const removeProvider = (
	providers: Provider[],
	provider: Provider | { id: string }
) => {
	window.localStorage.removeItem(`identityProvider:${provider.id}`);

	const index = providers.findIndex((x) => x.id === provider.id);
	if (index < 0) {
		return providers;
	}

	const newProviders = [...providers];
	newProviders.splice(index, 1);
	storeProviders(newProviders);

	return newProviders;
};

const updateProvider = (providers: Provider[], provider: Provider) => {
	window.localStorage.setItem(
		`identityProvider:${provider.id}`,
		JSON.stringify(provider)
	);

	const newProviders = [...providers];
	const index = newProviders.findIndex((x) => x.id === provider.id);

	newProviders[index] = { ...provider };

	return newProviders;
};

export const useProviders = () => {
	const [providers, setProviders] = useState(loadProviders());

	return {
		providers,
		addProvider: (provider: Provider) => {
			setProviders(addProvider(providers, provider));
		},
		removeProvider: (provider: Provider | { id: string }) => {
			setProviders(removeProvider(providers, provider));
		},
		updateProvider: (provider: Provider) => {
			setProviders(updateProvider(providers, provider));
		},
	};
};

export type ProvidersState = ReturnType<typeof useProviders>;

export const Providers = createContext(null as any as ProvidersState);
