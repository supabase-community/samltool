import { useState, useEffect } from "react";
import "./App.css";
import { parse } from "./saml";

function App() {
	const [count, setCount] = useState(0);

	useEffect(() => {
		(async () => {
			console.log(
				await parse(
					"assertion",
					`<?xml version="1.0" encoding="UTF-8"?>
<saml2:Assertion xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:xsd="http://www.w3.org/2001/XMLSchema" ID="_72591c79da230cac1457d0ea0f2771ab" IssueInstant="2022-08-11T14:53:38.260Z" Version="2.0">
	<saml2:Issuer>https://example.com/saml</saml2:Issuer>
	<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#"></ds:Signature>
	<saml2:Subject>
		<saml2:NameID xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" Format="urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress" NameQualifier="https://example.com/saml" SPNameQualifier="http://localhost:9999/saml/metadata">name-id@example.com</saml2:NameID>
		<saml2:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
			<saml2:SubjectConfirmationData Address="79.125.170.79" NotOnOrAfter="2022-08-11T14:58:38.272Z" Recipient="http://localhost:9999/saml/acs"/>
		</saml2:SubjectConfirmation>
	</saml2:Subject>
	<saml2:Conditions NotBefore="2022-08-11T14:53:38.260Z" NotOnOrAfter="2022-08-11T14:58:38.260Z">
		<saml2:AudienceRestriction>
			<saml2:Audience>http://localhost:9999/saml/metadata</saml2:Audience>
		</saml2:AudienceRestriction>
	</saml2:Conditions>
	<saml2:AuthnStatement AuthnInstant="2022-08-11T14:53:34.809Z" SessionIndex="_a5e14df3066529ca462930030712b65a">
		<saml2:SubjectLocality Address="127.0.0.1"/>
	<saml2:AuthnContext>
		<saml2:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml2:AuthnContextClassRef>
	</saml2:AuthnContext>
	</saml2:AuthnStatement>
	<saml2:AttributeStatement>
		<saml2:Attribute Name="urn:oasis:names:tc:SAML:attribute:subject-id" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri">
			<saml2:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xsd:string">subject-id</saml2:AttributeValue>
		</saml2:Attribute>
	</saml2:AttributeStatement>
</saml2:Assertion>
`
				)
			);
		})();
	}, []);

	return (
		<div>
			SAML tools by <a href="https://supabase.com">Supabase</a>. Built during{" "}
			<a href="https://launchweek.dev">#SupaLaunchWeek 5</a>.
		</div>
	);
}

export default App;
