import { useContext } from "react";

import { useDisclosure } from "@chakra-ui/react";

import { Button } from "@chakra-ui/react";
import { Container, Box, VStack, HStack, Flex } from "@chakra-ui/react";

import { Providers } from "../../Providers";

import AddNewIdentityProvider from "../../Modals/AddNewIdentityProvider";
import AddServiceProvider from "../../Modals/AddServiceProvider";

const ButtonAddIdentityProvider = () => {
	const { providers } = useContext(Providers);

	const { isOpen, onOpen, onClose } = useDisclosure();

	return (
		<Button onClick={onOpen}>
			Add new Identity Provider
			<AddNewIdentityProvider
				isOpen={isOpen}
				onClose={onClose}
				onOpen={onOpen}
			/>
		</Button>
	);
};

const ButtonAddServiceProvider = () => {
	const { isOpen, onOpen, onClose } = useDisclosure();

	return (
		<Button onClick={onOpen}>
			Add new Service Provider
			<AddServiceProvider isOpen={isOpen} onClose={onClose} onOpen={onOpen} />
		</Button>
	);
};

const Home = () => {
	const { providers } = useContext(Providers);

	return (
		<Container maxW="1200px">
			SAML tools by <a href="https://supabase.com">Supabase</a>. Built during{" "}
			<a href="https://launchweek.dev">#SupaLaunchWeek 5</a>.
			<VStack>
				<ButtonAddIdentityProvider />
				<ButtonAddServiceProvider />

				{providers.map((provider) => {
					return (
						<pre>
							{provider.id}: {provider.entityID}
						</pre>
					);
				})}
			</VStack>
		</Container>
	);
};

export default Home;
