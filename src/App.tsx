import { useState, useEffect, useContext } from "react";
import { Container, Box, VStack, HStack, Flex } from "@chakra-ui/react";

import { Button } from "@chakra-ui/react";

import {
	useDisclosure,
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalFooter,
	ModalBody,
	ModalCloseButton,
} from "@chakra-ui/react";

import {
	Input,
	Textarea,
	FormControl,
	FormLabel,
	FormErrorMessage,
	FormHelperText,
} from "@chakra-ui/react";

import "./App.css";

import { Providers, useProviders, emptyProvider, Provider } from "./Providers";

import { genprovider } from "./saml";

const EMPTY_PROVIDER = { ...emptyProvider(), name: "" };

const Page = () => {
	const { isOpen, onOpen, onClose } = useDisclosure();
	const { providers, addProvider } = useContext(Providers);

	const [newProvider, setNewProvider] = useState(EMPTY_PROVIDER);

	useEffect(() => {
		let ignore = false;

		if (!isOpen) {
			setNewProvider(EMPTY_PROVIDER);

			return;
		}

		(async () => {
			if (ignore) return;

			setNewProvider({ ...newProvider, ...(await genprovider("gsuite")) });
		})();

		return () => {
			ignore = true;
		};
	}, [isOpen]);

	return (
		<Container maxW="1200px">
			SAML tools by <a href="https://supabase.com">Supabase</a>. Built during{" "}
			<a href="https://launchweek.dev">#SupaLaunchWeek 5</a>.
			<VStack>
				<Button onClick={onOpen}>Add new Identity Provider</Button>

				{providers.map((provider) => {
					return (
						<pre>
							{provider.id}: {provider.entityID}
						</pre>
					);
				})}

				<Modal isOpen={isOpen} onClose={onClose}>
					<ModalOverlay />
					<ModalContent>
						<ModalHeader>Add new Identity Provider</ModalHeader>
						<ModalCloseButton />
						<ModalBody>
							<VStack spacing="1em">
								<FormControl>
									<FormLabel>Name</FormLabel>
									<Input
										value={newProvider.name}
										onChange={(e) =>
											setNewProvider({
												...newProvider,
												name: e.target.value.trimLeft(),
											})
										}
									/>
								</FormControl>
								<FormControl>
									<FormLabel>Entity ID</FormLabel>
									<Input size="sm" value={newProvider.entityID} readOnly />
								</FormControl>
								<FormControl>
									<FormLabel>SSO URL</FormLabel>
									<Input size="sm" value={newProvider.ssoURL} readOnly />
								</FormControl>
								<FormControl>
									<FormLabel>Certificate</FormLabel>
									<Textarea
										size="sm"
										value={newProvider.cert}
										resize="none"
										readOnly
									/>
								</FormControl>
								<FormControl>
									<FormLabel>Metadata XML</FormLabel>
									<Textarea
										size="sm"
										value={newProvider.metadata}
										resize="none"
										readOnly
									/>
								</FormControl>
							</VStack>
						</ModalBody>

						<ModalFooter>
							<Button variant="ghost" onClick={onClose}>
								Cancel
							</Button>
							<Button
								mr={3}
								onClick={() => {
									addProvider(newProvider);
									onClose();
									setNewProvider(EMPTY_PROVIDER);
								}}
							>
								Add
							</Button>
						</ModalFooter>
					</ModalContent>
				</Modal>
			</VStack>
		</Container>
	);
};

const SSO = ({ provider }: { provider: Provider }) => {
	return <pre>SSO!</pre>;
};

const SLO = ({ provider }: { provider: Provider }) => {
	return <pre>SSO!</pre>;
};

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

const NotFound = () => {
	return <>404 Not Found</>;
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
			: null;
	const sloProviderIndex =
		location.pathname !== "/"
			? sloURLs.findIndex((x) => match(x, location))
			: null;

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
				<Page />
			) : (
				<NotFound />
			)}
		</Providers.Provider>
	);
};

export default App;
