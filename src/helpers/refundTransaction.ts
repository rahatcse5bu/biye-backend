import fetch from "isomorphic-fetch";
import { get } from "node-global-storage";
import authHeaders from "./authHeaders";

const refundTransaction = async (body_data: any) => {
	console.log("refund start !!");
	const refundResponse = await fetch(
		get("bkash_base_url") + "/checkout/payment/refund",
		{
			method: "POST",
			headers: await authHeaders(),
			body: JSON.stringify(body_data),
		}
	);
	const refundResult = await refundResponse.json();
	return refundResult;
};

export default refundTransaction;
