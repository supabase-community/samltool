import init from "../assets/samltool.wasm?init";

import "./wasm_exec";

declare class Go {
	importObject: any;

	run(instance: any): any;
}

interface Library {
	parse: (
		what: "request" | "assertion",
		data: string
	) => { ok: { json: string; indent: string }; error: string };

	genprovider: (
		flavor: "gsuite",
		pkcs8: Uint8Array,
		entityID: string,
		ssoURL: string,
		sloURL: string
	) => {
		ok: {
			id: string;
			flavor: "gsuite";
			entityID: string;
			cert: string;
			metadata: string;
			privateKey: string;
			ssoURL: string;
			sloURL: string;
			notBefore: string;
			notAfter: string;
		};
		error: string;
	};
}

declare const __samltool: Library;

const go = new Go();

let instancePromise: Promise<Library> | null;

const instance = () => {
	if (!instancePromise) {
		instancePromise = (async () => {
			const wasmInstance = await init(go.importObject);

			go.run(wasmInstance);

			const library = __samltool;
			return library;
		})();
	}

	return instancePromise;
};

const result = <T>({ error, ok }: { ok: T; error: string }) => {
	if (error) {
		throw new Error(error);
	}

	return ok;
};

export const parse = async (what: "request" | "assertion", data: string) => {
	const { parse } = await instance();

	const { json, indent } = result(parse(what, data));

	return {
		json: JSON.parse(json),
		indent,
	};
};

export interface IdentityProvider {}

export const genprovider = async (flavor: "gsuite") => {
	const { genprovider } = await instance();

	const { privateKey } = await crypto.subtle.generateKey(
		{
			modulusLength: 2048,
			name: "RSASSA-PKCS1-v1_5",
			hash: "SHA-256",
			publicExponent: Uint8Array.from([0x01, 0x00, 0x01]),
		},
		true,
		["sign", "verify"]
	);

	const pkcs8 = await crypto.subtle.exportKey("pkcs8", privateKey);

	let entityID = "";
	let ssoURL = "";
	let sloURL = "";

	if (flavor === "gsuite") {
		const url = new URL(window.location.href);

		url.pathname = "/gsuite/o/saml2/idp";
		url.searchParams.forEach((p) => {
			url.searchParams.delete(p);
		});

		url.searchParams.set("idpid", `C${Math.floor(Math.random() * 10000000)}`);

		entityID = url.href;
		ssoURL = url.href;
		sloURL = url.href;
	}

	return result(
		genprovider(flavor, new Uint8Array(pkcs8), entityID, ssoURL, sloURL)
	);
};
