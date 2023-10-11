import { Request, Response } from "express";
import db from "../../../config/db";
import { RowDataPacket } from "mysql2";
import { sendSuccess } from "../../../shared/SendSuccess";
import { generatePlaceholders } from "../../../utils/generatePlaceholders";
import { GeneralInfoFields } from "./general_info.constant";
import { JwtPayload } from "jsonwebtoken";
import { error } from "console";
import httpsStatus from "http-status";

const getGeneralInfo = (req: Request, res: Response) => {
	const query = req.query;
	console.log(Object.keys(query).length);
	let conditions = "";
	Object.keys(query).forEach((key, index) => {
		conditions += `${key} = '${query[key]}'`;
		if (index < Object.keys(query).length - 1) {
			conditions += " AND ";
		}
	});

	let sql = `SELECT * FROM general_info`;
	if (conditions) {
		sql += ` WHERE ${conditions}`;
	}
	console.log({ conditions });
	console.log({ sql });
	db.query<RowDataPacket[]>(sql, (err, rows) => {
		if (err) {
			return res.send({
				message: err?.message,
				success: false,
			});
		}

		res
			.status(200)
			.json(
				sendSuccess<RowDataPacket[]>(
					"All General info  retrieved successfully",
					rows
				)
			);
	});
};

const getGeneralInfoByUserId = (req: Request, res: Response) => {
	const userId = req.params.id; // Assuming the user_id is in the route parameter
	const sql = "SELECT * FROM general_info WHERE user_id = ?";
	db.query<RowDataPacket[]>(sql, [userId], (err, rows) => {
		if (err) {
			res.send({
				message: err?.message,
				success: false,
			});
		} else {
			if (rows.length === 0) {
				res.status(404).json({
					message: "General info not found for the specified user_id",
					success: false,
				});
			} else {
				res.status(200).json({
					message: "General info retrieved successfully",
					success: true,
					data: rows[0], // Assuming you expect only one row per user_id
				});
			}
		}
	});
};

const getSingleGeneralInfo = (req: Request, res: Response) => {
	const userId = req.params.id; // Assuming you pass the user ID as a route parameter
	const sql = "SELECT * FROM general_info WHERE id = ?";

	db.query<RowDataPacket[]>(sql, [userId], (err, rows) => {
		if (err) {
			return res.status(500).json({
				message: err?.message,
				success: false,
			});
		}

		if (rows.length === 0) {
			return res.status(404).json({
				message: "General info not found",
				success: false,
			});
		}

		res
			.status(200)
			.json(sendSuccess<RowDataPacket[]>("General info retrieved", rows, 200));
	});
};

const createGeneralInfo = (req: Request, res: Response) => {
	const data = req.body;
	const { user_form, ...others } = data;
	let user_id: string | null = null;
	// console.log(req.user);
	const tokenId = (req.user?.token_id as JwtPayload) ?? null;
	if (!tokenId) {
		return res.status(401).send({
			statusCode: httpsStatus.UNAUTHORIZED,
			message: "You are not authorized",
			success: false,
		});
	}

	// Start a transaction
	db.beginTransaction((err) => {
		if (err) {
			console.error("Error starting transaction:", err);
			return res
				.status(500)
				.json({ success: false, message: "Internal Server Error", error: err });
		}

		// get user id using token id
		const getUserIdByTokenSql = `select id from user_info where token_id = ?`;

		db.query<RowDataPacket[]>(getUserIdByTokenSql, [tokenId], (err, result) => {
			if (err) {
				return rollbackAndRespond(res, db, null, {
					success: false,
					message: "You are not authorized",
					error: err,
				});
			}
			console.log(result);
			user_id = result[0]?.id;
			// Check if the user_id already exists in the database
			const checkSql =
				"SELECT COUNT(*) AS count FROM general_info WHERE user_id = ?";

			db.query<RowDataPacket[]>(checkSql, [user_id], (err, results) => {
				if (err) {
					console.error("Error checking User Id:", err);
					return rollbackAndRespond(res, db, err);
				}

				const count = results[0].count;

				if (count > 0) {
					// User with this user_id already exists, return an error response
					return rollbackAndRespond(res, db, null, {
						success: false,
						message: "User with this user id already exists",
					});
				}

				// Insert general_information into the database
				const insertSql = `INSERT INTO general_info (${GeneralInfoFields.join(
					","
				)}) VALUES (${generatePlaceholders(GeneralInfoFields.length)})`;
				const GeneralInfo: string[] = [];
				GeneralInfoFields.forEach((field) => {
					GeneralInfo.push(data[field]);
				});

				// Insert general information
				db.query(insertSql, GeneralInfo, (err, results) => {
					if (err) {
						console.error("Error inserting General info:", err);
						return rollbackAndRespond(res, db, err);
					}

					// Update the fields edited_timeline_index and last_edited_timeline_index of user_info table
					const updateUserInfoSql = `
        UPDATE user_info SET edited_timeline_index = CASE WHEN ${user_form} > edited_timeline_index THEN ${user_form} ELSE edited_timeline_index END,last_edited_timeline_index = ${user_form} WHERE id=?
      `;
					db.query(updateUserInfoSql, [user_id], (err, results) => {
						if (err) {
							console.error("Error updating user_info:", err);
							return rollbackAndRespond(res, db, err);
						}

						// Commit the transaction if everything is successful
						db.commit((err) => {
							if (err) {
								console.error("Error committing transaction:", err);
								return rollbackAndRespond(res, db, err);
							}

							res.status(201).json({
								success: true,
								message:
									"General info created and user_info updated successfully",
							});
						});
					});
				});
			});
		});
	});
};

// Helper function to rollback the transaction and respond with an error
function rollbackAndRespond(
	res: Response,
	db: any,
	err: any,
	responseObj?: any
) {
	db.rollback(() => {
		console.error("Transaction rolled back due to error:", err);
		if (responseObj) {
			res.status(500).json(responseObj);
		} else {
			res
				.status(500)
				.json({ success: false, message: "Internal Server Error", error: err });
		}
	});
}

const updateGeneralInfo = (req: Request, res: Response) => {
	const data = req.body;
	const token_id = (req.user?.token_id as JwtPayload) ?? null;
	let user_id: number | null = null;
	if (!token_id) {
		return res.status(401).send({
			statusCode: httpsStatus.UNAUTHORIZED,
			message: "You are not authorized",
			success: false,
		});
	}

	// Begin a database transaction
	db.beginTransaction((err) => {
		if (err) {
			console.error("Error starting transaction:", err);
			return res
				.status(500)
				.json({ success: false, message: "Internal Server Error", error: err });
		}
		// get user id using token id
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

				console.log(result);

				user_id = Number(result[0]?.id);

				if (isNaN(user_id)) {
					return rollbackAndRespond(res, db, null, {
						success: false,
						message: "You are not authorized",
						error: err,
					});
				}
				// Check if General info for the user with the given ID exists
				const checkUserSql = "SELECT * FROM general_info WHERE user_id = ?";

				db.query<RowDataPacket[]>(
					checkUserSql,
					[user_id],
					(err, userResults) => {
						if (err) {
							console.error("Error checking General info:", err);
							db.rollback(() => {
								res.status(500).json({ success: false, message: err?.message });
							});
							return;
						}

						const userCount = userResults.length;

						// If General info doesn't exist, send an error response
						if (userCount === 0) {
							db.rollback(() => {
								res
									.status(404)
									.json({ success: false, message: "General info not found" });
							});
							return;
						}

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
						const updateSql = `UPDATE general_info SET ${updateFields.join(
							", "
						)} WHERE user_id = ?`;

						updateValues.push(user_id);

						// Execute the update query within the transaction
						db.query(updateSql, updateValues, (err, results) => {
							if (err) {
								console.error("Error updating General info:", err);
								db.rollback(() => {
									res.status(500).json({
										success: false,
										message: "Internal Server Error",
										error: err,
									});
								});
							} else {
								// Commit the transaction if the update was successful
								db.commit(() => {
									res.status(200).json({
										message: "Update successfully completed",
										success: true,
										data: results,
									});
								});
							}
						});
					}
				);
			}
		);
	});
};

const deleteGeneralInfo = (req: Request, res: Response) => {
	const userId = req.params.id; // Assuming you pass the user ID in the URL

	// Check if general_info for the user with the given ID exists
	const checkUserSql =
		"SELECT COUNT(*) AS userCount FROM general_info WHERE id = ?";
	db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
		if (err) {
			console.error("Error checking General info:", err);
			return res
				.status(500)
				.json({ success: false, message: err?.message, error: err });
		}

		const userCount = userResults[0].userCount;

		// If general_info doesn't exist, send an error response
		if (userCount === 0) {
			return res
				.status(404)
				.json({ success: false, message: "general_info not found" });
		}

		// If General info exists, proceed with the deletion
		const deleteSql = "DELETE FROM general_info WHERE id = ?";
		db.query(deleteSql, [userId], (err, results) => {
			if (err) {
				console.error("Error deleting General info:", err);
				res.status(500).json({
					success: false,
					message: "Internal Server Error",
					error: err,
				});
			} else {
				res.status(200).json({
					success: true,
					message: "General info deleted successfully",
				});
			}
		});
	});
};

export const GeneralInfoController = {
	getGeneralInfo,
	getSingleGeneralInfo,
	createGeneralInfo,
	updateGeneralInfo,
	deleteGeneralInfo,
	getGeneralInfoByUserId,
};
