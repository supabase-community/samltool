import { useRef, useEffect } from "react";

const FormSAMLResponse = ({
	action,
	samlResponse,
	relayState,
}: {
	action: string;
	samlResponse: string;
	relayState?: string;
}) => {
	const formEl = useRef(null as any);

	useEffect(() => {
		setTimeout(() => {
			formEl.current?.submit();
		}, 250);
	}, [formEl]);

	return (
		<>
			<form ref={formEl} method="post" action={action}>
				<input type="hidden" name="SAMLResponse" value={samlResponse} />
				{relayState && (
					<input type="hidden" name="RelayState" value={relayState} />
				)}
				<input
					type="submit"
					style={{ visibility: "hidden" }}
					value="Continue"
				/>
			</form>
		</>
	);
};

export default FormSAMLResponse;
