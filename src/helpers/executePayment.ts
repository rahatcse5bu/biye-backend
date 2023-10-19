import fetch from "isomorphic-fetch";
import authHeaders from "./authHeaders";
import { get } from "node-global-storage";

const executePayment = async (paymentID: string) => {
	console.log("execute start !!");
	const executeResponse = await fetch(
		get("bkash_base_url") + "/checkout/execute",
		{
			method: "POST",
			headers: await authHeaders(),
			body: JSON.stringify({
				paymentID,
			}),
		}
	);
	const executeResult = await executeResponse.json();
	return executeResult;
};

export default executePayment;
