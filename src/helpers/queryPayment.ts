import fetch from "isomorphic-fetch";
import { get } from "node-global-storage";
import authHeaders from "./authHeaders";

const queryPayment = async (paymentID: string) => {
	console.log("query start !!");
	const queryResponse = await fetch(
		get("bkash_base_url") + "/checkout/payment/status",
		{
			method: "POST",
			headers: await authHeaders(),
			body: JSON.stringify({
				paymentID,
			}),
		}
	);
	const queryResult = await queryResponse.json();
	return queryResult;
};

export default queryPayment;
