import { Request, Response } from "express";
import db from "../../../config/db";
import { RowDataPacket } from "mysql2";
import { sendSuccess } from "../../../shared/SendSuccess";
import { generatePlaceholders } from "../../../utils/generatePlaceholders";
import { RefundFields } from "./refunds.constant";
import httpStatus from "http-status";
import { rollbackAndRespond } from "../../../utils/response";
import { JwtPayload } from "jsonwebtoken";

export const RefundController = {
	getRefundList: (req: Request, res: Response) => {
		// Handle the GET request to retrieve refunds here
		const sql = "SELECT * FROM refunds WHERE refund_status = 'requested'";
		db.query(sql, (err, result) => {
			if (err) {
				console.error("Error retrieving refunds:", err);
				res.status(500).json({
					success: false,
					message: "Internal Server Error",
					error: err,
				});
				return;
			}
			res.status(200).json({
				success: true,
				data: result,
			});
		});
	},
	addRefundRequest: (req: Request, res: Response) => {
		const token_id = req.user?.token_id;
		const data = req.body;
		console.log(token_id);
		let user_id: string | null = null;

		if (!token_id) {
			return res.status(401).send({
				statusCode: httpStatus.UNAUTHORIZED,
				message: "You are not authorized",
				success: false,
			});
		}

		db.beginTransaction((err) => {
			if (err) {
				console.error("Error starting transaction:", err);
				return res.status(500).json({
					success: false,
					message: "Internal Server Error",
					error: err,
				});
			}

			//! Get user_id using token_id
			const getUserIdByTokenSql = `SELECT id FROM user_info WHERE token_id = ?`;
			db.query<RowDataPacket[]>(
				getUserIdByTokenSql,
				[token_id],
				(err, result) => {
					if (err) {
						return rollbackAndRespond(res, db, null, {
							success: false,
							message: "You are not authorized",
							error: err,
						});
					}

					user_id = result[0]?.id;

					// console.log({ user_id });
					if (!user_id) {
						return rollbackAndRespond(res, db, null, {
							success: false,
							message: "You are not authorized",
							error: err,
						});
					}

					// Check if payment_id and transaction_id exist
					const checkPaymentAndTransactionSql = `SELECT user_id,payment_id FROM refunds WHERE payment_id = ? AND transaction_id = ?`;
					db.query<RowDataPacket[]>(
						checkPaymentAndTransactionSql,
						[data.payment_id, data.transaction_id],
						(err, result) => {
							if (err) {
								return rollbackAndRespond(res, db, null, {
									success: false,
									message:
										"Error occurred while checking payment and transaction",
									error: err,
								});
							}

							if (result.length > 0) {
								return rollbackAndRespond(res, db, null, {
									success: false,
									message: "You are already requested for refunding",
									error: null,
								});
							}

							// If payment_id and transaction_id exist, proceed with adding refund request
							const sql =
								"INSERT INTO refunds (user_id, payment_id, transaction_id, refund_amount, refund_status) VALUES (?, ?, ?, ?, ?)";
							db.query(
								sql,
								[
									user_id,
									data.payment_id,
									data.transaction_id,
									data.amount,
									data.refund_status,
								],
								(err, result) => {
									if (err) {
										console.error("Error adding refund request:", err);
										res.status(500).json({
											success: false,
											message: "Internal Server Error",
											error: err,
										});
										return;
									}
									db.commit(() => {
										res.status(200).json({
											message: "successfully completed",
											success: true,
											data: result,
										});
									});
								}
							);
						}
					);
				}
			);
		});
	},
};

export default RefundController;
