import { Request, Response } from "express";
import createPayment from "../../../helpers/createPayment";
import queryPayment from "../../../helpers/queryPayment";
import searchTransaction from "../../../helpers/searchTransaction";
import refundTransaction from "../../../helpers/refundTransaction";
import executePayment from "../../../helpers/executePayment";

const create = async (req: Request, res: Response) => {
	try {
		const createResult = await createPayment(req.body); // pass amount & callbackURL from frontend
		console.log('create payment~',createResult);
		res.json(createResult);
	} catch (e) {
		console.log(e);
	}
};

const execute = async (req: Request, res: Response) => {
	try {
		let executeResponse = await executePayment(req.body.paymentID);
		res.json(executeResponse);
	} catch (e) {
		console.log(e);
	}
};

const query = async (req: Request, res: Response) => {
	try {
		let queryResponse = await queryPayment(req.body.paymentID);
		res.json(queryResponse);
	} catch (e) {
		console.log(e);
	}
};

const search = async (req: Request, res: Response) => {
	try {
		res.send(await searchTransaction(req.body.trxID));
	} catch (e) {
		console.log(e);
	}
};

const refund = async (req: Request, res: Response) => {
	try {
		const refundStatusBody = {
			paymentID: req.body.paymentID,
			trxID: req.body.trxID,
		};

		const refundStatusResponse: any = await refundTransaction(refundStatusBody);

		if (refundStatusResponse?.refundTrxID) {
			console.log("status");
			res.send(refundStatusResponse);
		} else {
			console.log("refund");
			res.send(await refundTransaction(req.body));
		}
	} catch (e) {
		console.log(e);
	}
};

export const bkashControllers = {
	create,
	refund,
	search,
	execute,
	query,
};
