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
	) => { ok: string; error: string };
}

declare const __samltool: Library;

const go = new Go();

const instance = (async () => {
	const instance = await init(go.importObject);

	go.run(instance);

	const library = __samltool;

	return library;
})();

const result = ({ error, ok }: { ok: string; error: string }) => {
	if (error) {
		throw new Error(error);
	}

	return ok;
};

export const parse = async (what: "request" | "assertion", data: string) => {
	const { parse } = await instance;

	return JSON.parse(result(parse(what, data)));
};
