import { useEffect, useState, useMemo } from "react";

import { Container, Box, VStack } from "@chakra-ui/react";

import { Textarea, Button, FormControl, FormLabel } from "@chakra-ui/react";

import { Provider } from "../../Providers";

import { sso } from "../../saml";

const SSO = ({ provider }: { provider: Provider }) => {
	const [data, setData] = useState("");
	const [cont, setCont] = useState({ cont: null as any });
	const [form, setForm] = useState(
		null as null | {
			SAMLResponse: string;
			RelayState: string;
			URL: string;
			xml: string;
			json: string;
		}
	);

	useEffect(() => {
		let ignore = false;

		(async () => {
			const { request, cont } = await sso(provider, window.location.href);
			setData(JSON.stringify(request, null, "  "));
			setCont({ cont });
		})();

		return () => {
			ignore = true;
		};
	}, [provider]);

	useEffect(() => {
		console.log(form);
	}, [form]);

	const onContinue = useMemo(
		() => () => {
			setForm(
				cont.cont({
					ID: "test",
					UserName: "Test",
					UserEmail: "test@saml.sh",
				})
			);
		},
		[cont]
	);

	return (
		<Container maxW="1200px">
			<VStack>
				<FormControl>
					<FormLabel>Authentication Request</FormLabel>
					<Textarea value={data} isReadOnly />
				</FormControl>
				<Button onClick={onContinue}>Continue</Button>
			</VStack>
		</Container>
	);
};

export default SSO;
