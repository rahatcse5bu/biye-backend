// import { Request, Response } from "express";
// import db from "../../../config/db";
// import { RowDataPacket } from "mysql2";
// import { sendSuccess } from "../../../shared/SendSuccess";
// import { MaritalInfoFields } from "./marital_info.constant";
// import { generatePlaceholders } from "../../../utils/generatePlaceholders";
// import { rollbackAndRespond } from "../../../utils/response";
// import { JwtPayload } from "jsonwebtoken";
// import httpStatus from "http-status";

// const getMaritalInfo = (req: Request, res: Response) => {
// 	const sql = "SELECT * FROM marital_info";
// 	db.query<RowDataPacket[]>(sql, (err, rows) => {
// 		if (err) {
// 			res.send({
// 				message: err?.message,
// 				success: false,
// 			});
// 		}

// 		res
// 			.status(200)
// 			.json(
// 				sendSuccess<RowDataPacket[]>(
// 					"All Marital info  retrieved successfully",
// 					rows
// 				)
// 			);
// 	});
// };

// const getSingleMaritalInfo = (req: Request, res: Response) => {
// 	const userId = req.params.id; // Assuming you pass the user ID as a route parameter
// 	const sql = "SELECT * FROM marital_info WHERE id = ?";

// 	db.query<RowDataPacket[]>(sql, [userId], (err, rows) => {
// 		if (err) {
// 			return res.status(500).json({
// 				message: err?.message,
// 				success: false,
// 			});
// 		}

// 		if (rows.length === 0) {
// 			return res.status(404).json({
// 				message: "Marital info not found",
// 				success: false,
// 			});
// 		}

// 		res
// 			.status(200)
// 			.json(sendSuccess<RowDataPacket[]>("Marital info retrieved", rows, 200));
// 	});
// };

// const createMaritalInfo = (req: Request, res: Response) => {
// 	const data = req.body;
// 	const token_id = req.user?.token_id;
// 	let { user_form, ...others } = data;

// 	let user_id: string | null = null;
// 	// console.log(req.user);
// 	if (!token_id) {
// 		return res.status(401).send({
// 			statusCode: httpStatus.UNAUTHORIZED,
// 			message: "You are not authorized",
// 			success: false,
// 		});
// 	}

// 	db.beginTransaction((err) => {
// 		if (err) {
// 			console.error("Error starting transaction:", err);
// 			return res
// 				.status(500)
// 				.json({ success: false, message: "Internal Server Error", error: err });
// 		}

// 		//! get user_id using token_id
// 		const getUserIdByTokenSql = `select id from user_info where token_id = ?`;
// 		db.query<RowDataPacket[]>(
// 			getUserIdByTokenSql,
// 			[token_id],
// 			(err, result) => {
// 				if (err) {
// 					return rollbackAndRespond(res, db, null, {
// 						success: false,
// 						message: "You are not authorized",
// 						error: err,
// 					});
// 				}
// 				//console.log(result);

// 				user_id = result[0]?.id;

// 				//! Check if the user_id already exists in the database

// 				const checkSql =
// 					"SELECT COUNT(*) AS count FROM marital_info  WHERE user_id = ?";

// 				db.query<RowDataPacket[]>(checkSql, [user_id], (err, results) => {
// 					if (err) {
// 						console.error("Error checking User Id:", err);
// 						return rollbackAndRespond(res, db, err);
// 					}

// 					const count = results[0].count;

// 					if (count > 0) {
// 						//! User with this user_id already exists, return an error response
// 						return rollbackAndRespond(res, db, null, {
// 							success: false,
// 							message: "User with this user id already exists",
// 						});
// 					}

// 					others = {
// 						...others,
// 						user_id,
// 					};

// 					const keys = Object.keys(others);
// 					const values = Object.values(others);

// 					//! Insert  into the database
// 					const insertSql = `INSERT INTO marital_info (${keys.join(
// 						","
// 					)}) VALUES (${generatePlaceholders(values.length)})`;
// 					const expectedLifePartner: string[] = [];
// 					keys.forEach((field) => {
// 						expectedLifePartner.push(others[field]);
// 					});

// 					//! Insert family status information
// 					db.query(insertSql, expectedLifePartner, (err, results) => {
// 						if (err) {
// 							console.error("Error inserting General info:", err);
// 							return rollbackAndRespond(res, db, err);
// 						}

// 						//! Update the fields edited_timeline_index and last_edited_timeline_index of user_info table
// 						const updateUserInfoSql = `
//             UPDATE user_info SET edited_timeline_index = CASE WHEN ${user_form} > edited_timeline_index THEN ${user_form} ELSE edited_timeline_index END,last_edited_timeline_index = ${user_form} WHERE id=?
//           `;
// 						db.query(updateUserInfoSql, [user_id], (err, results) => {
// 							if (err) {
// 								console.error("Error updating user_info:", err);
// 								return rollbackAndRespond(res, db, err);
// 							}

// 							// Commit the transaction if everything is successful
// 							db.commit((err) => {
// 								if (err) {
// 									console.error("Error committing transaction:", err);
// 									return rollbackAndRespond(res, db, err);
// 								}

// 								res.status(201).json({
// 									success: true,
// 									message:
// 										"Marital info created and user_info updated successfully",
// 								});
// 							});
// 						});
// 					});
// 				});
// 			}
// 		);
// 	});
// };

// const updateMaritalInfo = (req: Request, res: Response) => {
// 	const data = req.body;
// 	const token_id = (req.user?.token_id as JwtPayload) ?? null;
// 	let user_id: number | null = null;
// 	if (!token_id) {
// 		return res.status(401).send({
// 			statusCode: httpStatus.UNAUTHORIZED,
// 			message: "You are not authorized",
// 			success: false,
// 		});
// 	}

// 	//! Begin a database transaction
// 	db.beginTransaction((err) => {
// 		if (err) {
// 			console.error("Error starting transaction:", err);
// 			return res
// 				.status(500)
// 				.json({ success: false, message: "Internal Server Error", error: err });
// 		}
// 		// get user id using token id
// 		const getUserIdByTokenSql = `select id from user_info where token_id = ?`;
// 		db.query<RowDataPacket[]>(
// 			getUserIdByTokenSql,
// 			[token_id],
// 			(err, result) => {
// 				if (err) {
// 					return rollbackAndRespond(res, db, null, {
// 						success: false,
// 						message: "You are not authorized",
// 						error: err,
// 					});
// 				}

// 				console.log(result);

// 				user_id = Number(result[0]?.id);

// 				if (isNaN(user_id)) {
// 					return rollbackAndRespond(res, db, null, {
// 						success: false,
// 						message: "You are not authorized",
// 						error: err,
// 					});
// 				}
// 				//! Check if General info for the user with the given ID exists
// 				const checkUserSql =
// 					"SELECT user_id FROM marital_info WHERE user_id = ?";

// 				db.query<RowDataPacket[]>(
// 					checkUserSql,
// 					[user_id],
// 					(err, userResults) => {
// 						if (err) {
// 							console.error("Error checking Marital info:", err);
// 							db.rollback(() => {
// 								res.status(500).json({ success: false, message: err?.message });
// 							});
// 							return;
// 						}

// 						const userCount = userResults.length;

// 						//! If Marital info doesn't exist, send an error response
// 						if (userCount === 0) {
// 							db.rollback(() => {
// 								res.status(404).json({
// 									success: false,
// 									message: "Marital info not found",
// 								});
// 							});
// 							return;
// 						}

// 						//! Build the update SQL statement dynamically based on changed values
// 						const updateFields: string[] = [];
// 						const updateValues = [];

// 						Object.keys(data).forEach((key) => {
// 							updateFields.push(`${key} = ?`);
// 							updateValues.push(data[key]);
// 						});

// 						if (updateFields.length === 0) {
// 							// No fields to update
// 							db.commit(() => {
// 								res
// 									.status(200)
// 									.json({ success: true, message: "No changes to update" });
// 							});
// 							return;
// 						}

// 						// Construct the final update SQL statement
// 						const updateSql = `UPDATE marital_info  SET ${updateFields.join(
// 							", "
// 						)} WHERE user_id = ?`;

// 						updateValues.push(user_id);

// 						// Execute the update query within the transaction
// 						db.query(updateSql, updateValues, (err, results) => {
// 							if (err) {
// 								console.error("Error updating Marital info:", err);
// 								db.rollback(() => {
// 									res.status(500).json({
// 										success: false,
// 										message: "Internal Server Error",
// 										error: err,
// 									});
// 								});
// 							} else {
// 								// Commit the transaction if the update was successful
// 								db.commit(() => {
// 									res.status(200).json({
// 										message: "Update successfully completed",
// 										success: true,
// 										data: results,
// 									});
// 								});
// 							}
// 						});
// 					}
// 				);
// 			}
// 		);
// 	});
// };

// const deleteMaritalInfo = (req: Request, res: Response) => {
// 	const userId = req.params.id; // Assuming you pass the user ID in the URL

// 	// Check if marital_info for the user with the given ID exists
// 	const checkUserSql =
// 		"SELECT COUNT(*) AS userCount FROM marital_info WHERE id = ?";
// 	db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
// 		if (err) {
// 			console.error("Error checking Marital info:", err);
// 			return res.status(500).json({ success: false, message: err?.message });
// 		}

// 		const userCount = userResults[0].userCount;

// 		// If marital_info doesn't exist, send an error response
// 		if (userCount === 0) {
// 			return res
// 				.status(404)
// 				.json({ success: false, message: "marital_info not found" });
// 		}

// 		// If Marital info exists, proceed with the deletion
// 		const deleteSql = "DELETE FROM marital_info WHERE id = ?";
// 		db.query(deleteSql, [userId], (err, results) => {
// 			if (err) {
// 				console.error("Error deleting Marital info:", err);
// 				res
// 					.status(500)
// 					.json({ success: false, message: "Internal Server Error" });
// 			} else {
// 				res.status(200).json({
// 					success: true,
// 					message: "Marital info deleted successfully",
// 				});
// 			}
// 		});
// 	});
// };
// const getMaritalInfoByUserId = (req: Request, res: Response) => {
// 	const userId = req.params.id; // Assuming the user_id is in the route parameter
// 	const sql = "SELECT * FROM marital_info WHERE user_id = ?";
// 	db.query<RowDataPacket[]>(sql, [userId], (err, rows) => {
// 		if (err) {
// 			res.send({
// 				message: err?.message,
// 				success: false,
// 			});
// 		} else {
// 			if (rows.length === 0) {
// 				res.status(404).json({
// 					message: "Marital info not found for the specified user_id",
// 					success: false,
// 				});
// 			} else {
// 				res.status(200).json({
// 					message: "Marital info retrieved successfully",
// 					success: true,
// 					data: rows[0], // Assuming you expect only one row per user_id
// 				});
// 			}
// 		}
// 	});
// };

// export const MaritalInfoController = {
// 	getMaritalInfo,
// 	getSingleMaritalInfo,
// 	createMaritalInfo,
// 	updateMaritalInfo,
// 	deleteMaritalInfo,
// 	getMaritalInfoByUserId,
// };
