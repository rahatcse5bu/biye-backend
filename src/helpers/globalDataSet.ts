import { set } from "node-global-storage";

const globalDataSet = (tokenResult: { id_token: string }) => {
	set("id_token", tokenResult.id_token as string);
};

export default globalDataSet;
