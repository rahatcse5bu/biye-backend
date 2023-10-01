import { Request, Response } from "express";
import db from "../../../config/db";
import { RowDataPacket } from "mysql2";
import { sendSuccess } from "../../../shared/SendSuccess";
import { generatePlaceholders } from "../../../utils/generatePlaceholders";
import { ContactFields } from "./contact.constant";
import { rollbackAndRespond } from "../../../utils/response";
import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";

const getContact = (req: Request, res: Response) => {
	const sql = "SELECT * FROM contact";
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
					"All contact  retrieved successfully",
					rows
				)
			);
	});
};

const getSingleContact = (req: Request, res: Response) => {
	const userId = req.params.id; // Assuming you pass the user ID as a route parameter
	const sql = "SELECT * FROM contact WHERE id = ?";

	db.query<RowDataPacket[]>(sql, [userId], (err, rows) => {
		if (err) {
			return res.status(500).json({
				message: err?.message,
				success: false,
			});
		}

		if (rows.length === 0) {
			return res.status(404).json({
				message: "contact not found",
				success: false,
			});
		}

		res
			.status(200)
			.json(sendSuccess<RowDataPacket[]>("contact retrieved", rows, 200));
	});
};

const createContact = (req: Request, res: Response) => {
	const data = req.body;
	const token_id = req.user?.token_id;
	let { user_form, ...others } = data;

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

		//! get user_id using token_id
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

				//! Check if the user_id already exists in the database

				const checkSql =
					"SELECT COUNT(*) AS count FROM contact WHERE user_id = ?";

				db.query<RowDataPacket[]>(checkSql, [user_id], (err, results) => {
					if (err) {
						console.error("Error checking User Id:", err);
						return rollbackAndRespond(res, db, err);
					}

					const count = results[0].count;

					if (count > 0) {
						//! User with this user_id already exists, return an error response
						return rollbackAndRespond(res, db, null, {
							success: false,
							message: "User with this user id already exists",
						});
					}

					others = {
						...others,
						user_id,
					};

					const keys = Object.keys(others);
					const values = Object.values(others);

					//! Insert  into the database
					const insertSql = `INSERT INTO contact (${keys.join(
						","
					)}) VALUES (${generatePlaceholders(values.length)})`;
					const contact: string[] = [];
					keys.forEach((field) => {
						contact.push(others[field]);
					});

					//! Insert family status information
					db.query(insertSql, contact, (err, results) => {
						if (err) {
							console.error("Error inserting Expected Life Partner:", err);
							return rollbackAndRespond(res, db, err);
						}

						//! Update the fields edited_timeline_index and last_edited_timeline_index of user_info table
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
									message: "Contact created and user_info updated successfully",
								});
							});
						});
					});
				});
			}
		);
	});
};

const updateContact = (req: Request, res: Response) => {
	const data = req.body;
	const token_id = (req.user?.token_id as JwtPayload) ?? null;
	let user_id: number | null = null;
	if (!token_id) {
		return res.status(401).send({
			statusCode: httpStatus.UNAUTHORIZED,
			message: "You are not authorized",
			success: false,
		});
	}

	//! Begin a database transaction
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
				//! Check if Expected Life Partner for the user with the given ID exists
				const checkUserSql = "SELECT user_id FROM contact WHERE user_id = ?";

				db.query<RowDataPacket[]>(
					checkUserSql,
					[user_id],
					(err, userResults) => {
						if (err) {
							console.error("Error checking Contact:", err);
							db.rollback(() => {
								res.status(500).json({ success: false, message: err?.message });
							});
							return;
						}

						const userCount = userResults.length;

						//! If Contact doesn't exist, send an error response
						if (userCount === 0) {
							db.rollback(() => {
								res.status(404).json({
									success: false,
									message: "Contact not found",
								});
							});
							return;
						}

						//! Build the update SQL statement dynamically based on changed values
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
						const updateSql = `UPDATE contact SET ${updateFields.join(
							", "
						)} WHERE user_id = ?`;

						updateValues.push(user_id);

						// Execute the update query within the transaction
						db.query(updateSql, updateValues, (err, results) => {
							if (err) {
								console.error("Error updating Contact:", err);
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

const deleteContact = (req: Request, res: Response) => {
	const userId = req.params.id; // Assuming you pass the user ID in the URL

	// Check if contact for the user with the given ID exists
	const checkUserSql = "SELECT COUNT(*) AS userCount FROM contact WHERE id = ?";
	db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
		if (err) {
			console.error("Error checking contact:", err);
			return res.status(500).json({ success: false, message: err?.message });
		}

		const userCount = userResults[0].userCount;

		// If contact doesn't exist, send an error response
		if (userCount === 0) {
			return res
				.status(404)
				.json({ success: false, message: "contact not found" });
		}

		// If contact exists, proceed with the deletion
		const deleteSql = "DELETE FROM contact WHERE id = ?";
		db.query(deleteSql, [userId], (err, results) => {
			if (err) {
				console.error("Error deleting contact:", err);
				res
					.status(500)
					.json({ success: false, message: "Internal Server Error" });
			} else {
				res
					.status(200)
					.json({ success: true, message: "contact deleted successfully" });
			}
		});
	});
};

const getContactByUserId = (req: Request, res: Response) => {
	const userId = req.params.id; // Assuming the user_id is in the route parameter
	const sql = "SELECT * FROM contact WHERE user_id = ?";
	db.query<RowDataPacket[]>(sql, [userId], (err, rows) => {
		if (err) {
			res.send({
				message: err?.message,
				success: false,
			});
		} else {
			if (rows.length === 0) {
				res.status(404).json({
					message: "Contact not found for the specified user_id",
					success: false,
				});
			} else {
				res.status(200).json({
					message: "Contact retrieved successfully",
					success: true,
					data: rows[0], // Assuming you expect only one row per user_id
				});
			}
		}
	});
};

export const ContactController = {
	getContact,
	getSingleContact,
	createContact,
	updateContact,
	deleteContact,
	getContactByUserId,
};
