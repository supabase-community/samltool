import { useMemo } from "react";

import FormSAMLResponse from "../../saml/FormSAMLResponse";

const Respond = () => {
	const url = useMemo(() => new URL(window.location.href), []);

	const samlResponse = useMemo(
		() => url.searchParams.get("SAMLResponse")!,
		[url]
	);
	const relayState = useMemo(
		() => url.searchParams.get("RelayState") || undefined,
		[url]
	);
	const action = useMemo(() => url.searchParams.get("URL")!, [url]);

	return (
		<FormSAMLResponse
			action={action}
			relayState={relayState}
			samlResponse={samlResponse}
		/>
	);
};

export default Respond;
