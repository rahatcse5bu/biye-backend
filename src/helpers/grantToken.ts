import fetch from "isomorphic-fetch";
import tokenParameters from "./tokenParameters";
import globalDataSet from "./globalDataSet";
import tokenHeaders from "./tokenHeaders";
import { get } from "node-global-storage";

const grantToken = async () => {
	try {
		console.log("grant token start !!");
		const tokenResponse = await fetch(
			`${get("bkash_base_url")}/checkout/token/grant`,
			{
				method: "POST",
				headers: tokenHeaders(),
				body: JSON.stringify(tokenParameters()),
			}
		);
		const tokenResult = await tokenResponse.json();
		console.log(tokenResult);
		console.log(get("bkash_base_url"));
		globalDataSet(tokenResult);
		console.log(tokenHeaders());

		return tokenResult;
	} catch (e) {
		console.log(e);
	}
};

export default grantToken;
