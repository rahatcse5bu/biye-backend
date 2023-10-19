import { v4 as uuidv4 } from "uuid";
import { get } from "node-global-storage";
import authHeaders from "./authHeaders";
import fetch from "isomorphic-fetch";
interface CustomRequest extends Request {
	callbackURL?: string;
	amount?: number;
}
const createPayment = async (req: CustomRequest) => {
	try {
		console.log("create start !!");
		if (!req.amount || !req.callbackURL) {
			return "amount & callbackURL required";
		}

		if (req.amount && req.amount < 1) {
			return "minimum amount is 1 tk";
		}

		const createResponse = await fetch(
			get("bkash_base_url") + "/checkout/create",
			{
				method: "POST",
				headers: await authHeaders(),
				body: JSON.stringify({
					mode: "0011",
					payerReference: "132",
					callbackURL: req.callbackURL,
					amount: req.amount,
					currency: "BDT",
					intent: "sale",
					merchantInvoiceNumber: "Inv" + uuidv4().substring(0, 5),
				}),
			}
		);

		const createResult = await createResponse.json();

		return createResult;
	} catch (e) {
		console.log(e);
	}
};

export default createPayment;
