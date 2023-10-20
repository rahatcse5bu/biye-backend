import { Request, Response } from "express";
import db from "../../../config/db";
import { RowDataPacket } from "mysql2";
import { sendSuccess } from "../../../shared/SendSuccess";
import { generatePlaceholders } from "../../../utils/generatePlaceholders";
import { PaymentsFields, amountToPoints } from "./payments.constant";
import { rollbackAndRespond } from "../../../utils/response";
import httpStatus from "http-status";

const getPayments = (req: Request, res: Response) => {
	const sql = "SELECT * FROM payments";
	db.query<RowDataPacket[]>(sql, (err, rows) => {
		if (err) {
			res.send({
				message: err?.message,
				success: false,
			});
		}

		res
			.status(200)
			.json(
				sendSuccess<RowDataPacket[]>(
					"All payments  retrieved successfully",
					rows
				)
			);
	});
};

const getSinglePayments = (req: Request, res: Response) => {
	const userId = req.params.id; // Assuming you pass the user ID as a route parameter
	const sql = "SELECT * FROM payments WHERE id = ?";

	db.query<RowDataPacket[]>(sql, [userId], (err, rows) => {
		if (err) {
			return res.status(500).json({
				message: err?.message,
				success: false,
			});
		}

		if (rows.length === 0) {
			return res.status(404).json({
				message: "payments not found",
				success: false,
			});
		}

		res
			.status(200)
			.json(sendSuccess<RowDataPacket[]>("payments retrieved", rows, 200));
	});
};

const createPayments = async (req: Request, res: Response) => {
	const data = req.body;
	const token_id = req.user?.token_id;
	let { ...others } = data;
	let user_id: string | null = null;
	// console.log(req.user);
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
			return res
				.status(500)
				.json({ success: false, message: "Internal Server Error", error: err });
		}

		//? get user_id using token_id
		const getUserIdByTokenSql = `select id from user_info where token_id = ?`;
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
				//console.log(result);

				user_id = result[0].id;

				//! now save payment information to payments table

				others = {
					...others,
					user_id,
				};

				const keys = Object.keys(others);
				const values = Object.values(others);

				//! Insert  into the database
				const insertSql = `INSERT INTO payments (${keys.join(
					","
				)}) VALUES (${generatePlaceholders(values.length)})`;
				const payment: string[] = [];
				keys.forEach((field) => {
					payment.push(others[field]);
				});

				db.query(insertSql, payment, (err, results) => {
					if (err) {
						console.error("Error inserting payments history", err);
						return rollbackAndRespond(res, db, err);
					}

					const paymentStatus = others["status"];
					const amount = +others["amount"];
					let points = 0;
					if (paymentStatus === "Completed") {
						points = amountToPoints[amount] ? +amountToPoints[amount] : 0;
					} else {
						points = 0;
					}
					console.log(points);
					const updateGeneralInfoSql = `UPDATE general_info SET points = points + ${points} where user_id= ?
            `;

					db.query(updateGeneralInfoSql, [user_id], (err, results) => {
						if (err) {
							console.error("Error updating user_info:", err);
							return rollbackAndRespond(res, db, err);
						}

						//! Commit the transaction if everything is successful
						db.commit((err) => {
							if (err) {
								console.error("Error committing transaction:", err);
								return rollbackAndRespond(res, db, err);
							}

							res.status(201).json({
								success: true,
								message:
									"Payments created and general info updated successfully",
							});
						});
					});
				});
			}
		);
	});
};

const updatePayments = (req: Request, res: Response) => {
	const data = req.body;
	const userId = req.params.id; // Assuming you pass the user ID in the URL

	console.log(data);

	// Begin a database transaction
	db.beginTransaction((err) => {
		if (err) {
			console.error("Error starting transaction:", err);
			return res
				.status(500)
				.json({ success: false, message: "Internal Server Error" });
		}

		// Check if payments for the user with the given ID exists
		const checkUserSql = "SELECT * FROM payments WHERE id = ?";
		db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
			if (err) {
				console.error("Error checking payments:", err);
				db.rollback(() => {
					res.status(500).json({ success: false, message: err?.message });
				});
				return;
			}

			const userCount = userResults.length;

			// If payments doesn't exist, send an error response
			if (userCount === 0) {
				db.rollback(() => {
					res
						.status(404)
						.json({ success: false, message: "payments not found" });
				});
				return;
			}

			const currentUserData = userResults[0];

			// Build the update SQL statement dynamically based on changed values
			const updateFields: string[] = [];
			const updateValues = [];

			Object.keys(data).forEach((key) => {
				updateFields.push(`${key} = ?`);
				updateValues.push(data[key]);
			});

			if (updateFields.length === 0) {
				// No fields to update
				db.commit(() => {
					res
						.status(200)
						.json({ success: true, message: "No changes to update" });
				});
				return;
			}

			// Construct the final update SQL statement
			const updateSql = `UPDATE payments SET ${updateFields.join(
				", "
			)} WHERE id = ?`;

			updateValues.push(userId);

			// Execute the update query within the transaction
			db.query(updateSql, updateValues, (err, results) => {
				if (err) {
					console.error("Error updating payments:", err);
					db.rollback(() => {
						res
							.status(500)
							.json({ success: false, message: "Internal Server Error" });
					});
				} else {
					// Commit the transaction if the update was successful
					db.commit(() => {
						res
							.status(200)
							.json(sendSuccess("Update sucessfully completed", results, 200));
					});
				}
			});
		});
	});
};

const deletePayments = (req: Request, res: Response) => {
	const userId = req.params.id; // Assuming you pass the user ID in the URL

	// Check if payments for the user with the given ID exists
	const checkUserSql =
		"SELECT COUNT(*) AS userCount FROM payments WHERE id = ?";
	db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
		if (err) {
			console.error("Error checking payments:", err);
			return res.status(500).json({ success: false, message: err?.message });
		}

		const userCount = userResults[0].userCount;

		// If payments doesn't exist, send an error response
		if (userCount === 0) {
			return res
				.status(404)
				.json({ success: false, message: "payments not found" });
		}

		// If payments exists, proceed with the deletion
		const deleteSql = "DELETE FROM payments WHERE id = ?";
		db.query(deleteSql, [userId], (err, results) => {
			if (err) {
				console.error("Error deleting payments:", err);
				res
					.status(500)
					.json({ success: false, message: "Internal Server Error" });
			} else {
				res
					.status(200)
					.json({ success: true, message: "payments deleted successfully" });
			}
		});
	});
};

export const PaymentsController = {
	getPayments,
	getSinglePayments,
	createPayments,
	updatePayments,
	deletePayments,
};
