import fetch from "isomorphic-fetch";
import authHeaders from "./authHeaders";
import { get } from "node-global-storage";

const searchTransaction = async (trxID: string) => {
	console.log("search start !!");
	const searchResponse = await fetch(
		get("bkash_base_url") + "/checkout/general/search/searchTransaction",
		{
			method: "POST",
			headers: await authHeaders(),
			body: JSON.stringify({
				trxID,
			}),
		}
	);
	const searchResult = await searchResponse.json();
	return searchResult;
};

export default searchTransaction;
