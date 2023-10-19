import { get } from "node-global-storage";
import config from "../config";

const authHeaders = async (): Promise<HeadersInit> => {
	// console.log("token~", globals.get("id_token"));
	return {
		"Content-Type": "application/json",
		Accept: "application/json",
		authorization: get("id_token") as string, // Assuming 'id_token' is of type string
		"X-App-Key": config.bkash_app_key as string,
	};
};

export default authHeaders;
