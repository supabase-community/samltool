import { useEffect, useState, useMemo } from "react";

import { Container, Box, VStack } from "@chakra-ui/react";

import { Link } from "@chakra-ui/react";
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
	const respondURL = useMemo(() => {
		if (form) {
			const params = new URLSearchParams();
			params.set("SAMLResponse", form.SAMLResponse);
			params.set("URL", form.URL);
			if (form.RelayState) {
				params.set("RelayState", form.RelayState);
			}

			return `/respond?${params.toString()}`;
		} else {
			return null;
		}
	}, [form]);

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

	const onContinue = useMemo(
		() => () => {
			setForm(
				cont.cont({
					ID: "test",
					UserName: "Test",
					UserEmail: "test@saml.sh",
					NameID: "test",
					SubjectID: "test@saml.sh",
					CreateTime: new Date().toISOString(),
					ExpireTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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
				{form && form.xml && (
					<FormControl>
						<FormLabel>Response</FormLabel>
						<Textarea value={form.xml} isReadOnly />
					</FormControl>
				)}
				{form && form.json && (
					<FormControl>
						<FormLabel>Assertion</FormLabel>
						<Textarea value={form.json} isReadOnly />
					</FormControl>
				)}
				<Button onClick={onContinue}>Continue</Button>
				{respondURL && (
					<Link isExternal href={respondURL}>
						Continue
					</Link>
				)}
			</VStack>
		</Container>
	);
};

export default SSO;
