import { useState, useEffect, useContext, useMemo } from "react";
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
	Select,
	Checkbox,
	CheckboxGroup,
	FormControl,
	FormLabel,
	FormErrorMessage,
	FormHelperText,
} from "@chakra-ui/react";

import { Divider } from "@chakra-ui/react";

import {
	Providers,
	useProviders,
	emptyProvider,
	Provider,
} from "../../Providers";

import { parse, make } from "../../saml";

const CERTIFICATE_PEM_REGEX = /(\s*-+\s*(BEGIN|END)\s+CERTIFICATE\s*-+\s*)/i;

const AddServiceProvider = ({
	isOpen,
	onClose,
	onOpen,
}: {
	isOpen: boolean;
	onClose: () => void;
	onOpen: () => void;
}) => {
	const { providers, updateProvider } = useContext(Providers);

	const [providerID, setProviderID] = useState(
		providers.length ? providers[0].id : ""
	);
	const [name, setName] = useState("");
	const [siteURL, setSiteURL] = useState("");
	const [metadata, setMetadata] = useState("");
	const [metadataError, setMetadataError] = useState("");

	const [entityID, setEntityID] = useState("");
	const [acs, setACS] = useState("");
	const [cert, setCert] = useState("");

	const [signedRequests, setSignedRequests] = useState(false);

	const provider = useMemo(
		() => providers.find((x) => x.id === providerID)!,
		[providerID, providers]
	);

	const resetState = useMemo(
		() => () => {
			setName("");
			setSiteURL("");
			setMetadata("");
			setMetadataError("");
			setEntityID("");
			setACS("");
			setCert("");
			setSignedRequests(false);
		},
		[]
	);

	useEffect(() => {
		if (isOpen) {
			return;
		}

		resetState();
	}, [isOpen]);

	useEffect(() => {
		let ignore = false;

		if (!metadata) {
			resetState();
			return;
		}

		(async () => {
			try {
				const { json, indent } = await parse("metadata", metadata);
				if (ignore) return;

				console.log(json);

				setMetadataError("");
				setEntityID(json.EntityID);
				setACS(json.SPSSODescriptors[0].AssertionConsumerServices[0].Location);
				setSignedRequests(!!json.SPSSODescriptors[0].AuthnRequestsSigned);

				const signingKey = json.SPSSODescriptors[0].KeyDescriptors.find(
					(kd: any) => kd.Use === "signing"
				);

				if (!signingKey) {
					throw new Error("Metadata does not contain a signing key");
				}

				setCert(signingKey.KeyInfo.X509Data.X509Certificates[0].Data);
			} catch (e: any) {
				if (ignore) return;

				setMetadataError(e.message);
				setEntityID("");
				setACS("");
				setCert("");
				setSignedRequests(false);
			}
		})();

		return () => {
			ignore = true;
		};
	}, [metadata]);

	const onAdd = useMemo(
		() => () => {
			(async () => {
				let actualMetadata = metadata;

				if (!actualMetadata) {
					const { xml } = await make("metadata", {
						EntityID: entityID,
						SPSSODescriptors: [
							{
								AssertionConsumerServices: [
									{
										Binding: "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
										Location: acs,
									},
								],
								ProtocolSupportEnumeration: "",
								AuthnRequestsSigned: signedRequests,
								WantAssertionsSigned: true,
								KeyDescriptors: [
									{
										Use: "signing",
										KeyInfo: {
											X509Data: {
												X509Certificates: [
													{
														Data: cert,
													},
												],
											},
										},
									},
								],
							},
						],
					});

					actualMetadata = xml;
				}

				updateProvider({
					...provider,
					serviceProviders: {
						...(provider.serviceProviders || {}),
						[entityID]: {
							name,
							entityID,
							siteURL,
							metadata: actualMetadata,
							signingCert: cert
								.replace(CERTIFICATE_PEM_REGEX, "")
								.replace(CERTIFICATE_PEM_REGEX, ""),
							signedRequests,
							acsURL: acs,
						},
					},
				});

				onClose();
				resetState();
			})();
		},
		[provider, acs, signedRequests, entityID, siteURL, cert]
	);

	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<ModalOverlay />
			<ModalContent>
				<ModalHeader>Add new Service Provider</ModalHeader>
				<ModalCloseButton />
				<ModalBody>
					<VStack spacing="1em">
						<FormControl>
							<FormLabel>Identity Provider</FormLabel>
							<Select
								onChange={(e) => setProviderID(e.target.value)}
								value={providerID}
							>
								{providers.map(({ id, name, flavor }) => (
									<option key={id} value={id}>
										{name} {"gsuite" === flavor ? "(GSuite)" : ""}
									</option>
								))}
							</Select>
						</FormControl>
						<FormControl>
							<FormLabel>Name</FormLabel>
							<Input
								placeholder="Give it a name"
								value={name}
								onChange={(e) => setName(e.target.value.trimLeft())}
							/>
						</FormControl>
						<FormControl>
							<FormLabel>Site URL</FormLabel>
							<Input
								placeholder="URL to take the user to on login"
								value={siteURL}
								onChange={(e) => setSiteURL(e.target.value.trim())}
							/>
						</FormControl>
						<Divider />
						<FormControl isInvalid={!!metadataError}>
							<FormLabel>Upload Metadata</FormLabel>
							<Textarea
								size="sm"
								placeholder="Paste the metadata of the provider here."
								resize="none"
								value={metadata}
								onChange={(e) => setMetadata(e.target.value.trim())}
							/>
							{metadataError && (
								<FormErrorMessage>{metadataError}</FormErrorMessage>
							)}
						</FormControl>
						<FormControl>
							<FormLabel>Entity ID</FormLabel>
							<Input
								size="sm"
								placeholder="Add the Service Provider's Entity ID here"
								value={entityID}
								onChange={(e) => setEntityID(e.target.value.trim())}
								isReadOnly={!!(entityID && metadata && !metadataError)}
							/>
						</FormControl>
						<FormControl>
							<FormLabel>ACS URL</FormLabel>
							<Input
								size="sm"
								placeholder="Add the ACS URL of the provider here."
								value={acs}
								onChange={(e) => setACS(e.target.value.trim())}
								isReadOnly={!!(acs && metadata && !metadataError)}
							/>
						</FormControl>
						<FormControl>
							<FormLabel>Certificate</FormLabel>
							<Textarea
								size="sm"
								placeholder="Paste the signing certificate of the provider here."
								resize="none"
								value={cert}
								onChange={(e) => setCert(e.target.value.trim())}
								isReadOnly={!!(cert && metadata && !metadataError)}
							/>
						</FormControl>
						<FormControl>
							<FormLabel>Options</FormLabel>
							<CheckboxGroup>
								<HStack spacing="1em">
									<Checkbox
										isChecked={signedRequests}
										onChange={(e) => setSignedRequests(e.target.checked)}
										isReadOnly={!!(metadata && !metadataError)}
									>
										Signed requests
									</Checkbox>
								</HStack>
							</CheckboxGroup>
							{signedRequests && (
								<FormHelperText>
									Identity Provider initiated logins won't be possible.
								</FormHelperText>
							)}
						</FormControl>
					</VStack>
				</ModalBody>

				<ModalFooter>
					<Button variant="ghost" mr={3} onClick={onClose}>
						Close
					</Button>
					<Button onClick={onAdd}>Add</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};

export default AddServiceProvider;
