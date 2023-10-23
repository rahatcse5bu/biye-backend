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
		// Handle the POST request to add a refund request here
		const data = req.body;
		const sql =
			"INSERT INTO refunds (user_id, payment_id, transaction_id, refund_amount, refund_status) VALUES (?, ?, ?, ?, ?)";
		db.query(
			sql,
			[
				data.user_id,
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
				res.status(201).json({
					success: true,
					message: "Refund Request Added successfully",
					data: result,
				});
			}
		);
	},
};

export default RefundController;
