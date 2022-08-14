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

import {
	Providers,
	useProviders,
	emptyProvider,
	Provider,
} from "../../Providers";

import { genprovider } from "../../saml";

const EMPTY_PROVIDER = { ...emptyProvider(), name: "" };

const ModalAddNewIdentityProvider = ({
	isOpen,
	onOpen,
	onClose,
}: {
	isOpen: boolean;
	onOpen: () => void;
	onClose: () => void;
}) => {
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
								placeholder="Give it a name"
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
	);
};

export default ModalAddNewIdentityProvider;
