import config from "../config";
import { get, set, flush } from "node-global-storage";
const configSetup = async () => {
	console.log(get);

	const sandbox = config.sand_box?.toLowerCase();
	if (get("sandbox") !== sandbox) {
		flush();
		if (sandbox === "on") {
			set(
				"bkash_base_url",
				"https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized"
			);
		} else {
			set(
				"bkash_base_url",
				"https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized"
			);
		}
		set("sandbox", sandbox);
	} else {
		set("sandbox", sandbox);
	}
};

export default configSetup;
