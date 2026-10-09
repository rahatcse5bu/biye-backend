import fetch from "isomorphic-fetch";
import tokenParameters from "./tokenParameters";
import globalDataSet from "./globalDataSet";
import tokenHeaders from "./tokenHeaders";
import { get } from "node-global-storage";

const grantToken = async () => {
	try {
		const tokenResponse = await fetch(
			`${get("bkash_base_url")}/checkout/token/grant`,
			{
				method: "POST",
				headers: tokenHeaders(),
				body: JSON.stringify(tokenParameters()),
			}
		);
		const tokenResult = await tokenResponse.json();
		globalDataSet(tokenResult);

		return tokenResult;
	} catch (e) {
		console.error("bKash call failed:", (e as any)?.message || e);
	}
};

export default grantToken;
