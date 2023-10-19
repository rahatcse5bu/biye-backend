import configSetup from "../../helpers/configSetup";
import grantToken from "../../helpers/grantToken";
import { NextFunction, Request, Response } from "express";

const authCheck = async (req: Request, res: Response, next: NextFunction) => {
	configSetup();
	await grantToken();
	next();
};

export default authCheck;
