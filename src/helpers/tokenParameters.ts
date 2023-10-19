import config from "../config";

const tokenParameters = () => {
	return {
		app_key: config.bkash_app_key,
		app_secret: config.bkash_app_secret,
	};
};

export default tokenParameters;
