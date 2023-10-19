import config from "../config";

const tokenHeaders = (): HeadersInit => {
	return {
		"Content-Type": "application/json",
		Accept: "application/json",
		username: config.bkash_username as string,
		password: config.bkash_password as string,
	};
};

export default tokenHeaders;
