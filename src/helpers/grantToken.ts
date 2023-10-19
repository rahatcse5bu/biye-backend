import fetch from "isomorphic-fetch";
import tokenParameters from "./tokenParameters";
import globalDataSet from "./globalDataSet";
import tokenHeaders from "./tokenHeaders";

const grantToken = async () => {
	try {
		console.log("grant token start !!");
		const tokenResponse = await fetch(
			"https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/token/grant",
			{
				method: "POST",
				headers: tokenHeaders(),
				body: JSON.stringify(tokenParameters()),
			}
		);
		const tokenResult = await tokenResponse.json();
		console.log(tokenResult);
		globalDataSet(tokenResult);

		return tokenResult;
	} catch (e) {
		console.log(e);
	}
};

export default grantToken;
