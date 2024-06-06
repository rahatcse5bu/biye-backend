// import { Request, Response } from "express";
// import db from "../../../config/db";
// import { RowDataPacket } from "mysql2";
// import { sendSuccess } from "../../../shared/SendSuccess";
// import { generatePlaceholders } from "../../../utils/generatePlaceholders";
// import { rollbackAndRespond } from "../../../utils/response";
// import httpStatus from "http-status";
// import { JwtPayload } from "jsonwebtoken";

// const getContactPurchaseData = (req: Request, res: Response) => {
// 	const sql = "SELECT * FROM contact_purchase_data";
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
// 					"All contact_purchase_data  retrieved successfully",
// 					rows
// 				)
// 			);
// 	});
// };

// const getSingleContactPurchaseData = (req: Request, res: Response) => {
// 	const userId = req.params.id; // Assuming you pass the user ID as a route parameter
// 	const sql = "SELECT * FROM contact_purchase_data WHERE id = ?";

// 	db.query<RowDataPacket[]>(sql, [userId], (err, rows) => {
// 		if (err) {
// 			return res.status(500).json({
// 				message: err?.message,
// 				success: false,
// 			});
// 		}

// 		if (rows.length === 0) {
// 			return res.status(404).json({
// 				message: "contact_purchase_data not found",
// 				success: false,
// 			});
// 		}

// 		res
// 			.status(200)
// 			.json(
// 				sendSuccess<RowDataPacket[]>(
// 					"contact_purchase_data retrieved",
// 					rows,
// 					200
// 				)
// 			);
// 	});
// };

// const createContactPurchaseData = (req: Request, res: Response) => {
// 	const data = req.body;
// 	const token_id = req.user?.token_id;
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

// 				if (!user_id) {
// 					return rollbackAndRespond(res, db, null, {
// 						success: false,
// 						message: "You are not authorized",
// 						error: err,
// 					});
// 				}

// 				//! Check if the user_id already exists in the database

// 				const checkSql =
// 					"SELECT COUNT(*) AS count FROM contact_purchase_data WHERE user_id = ? AND bio_id = ?";

// 				db.query<RowDataPacket[]>(
// 					checkSql,
// 					[user_id, data?.bio_id],
// 					(err, results) => {
// 						if (err) {
// 							console.error("Error checking User Id:", err);
// 							return rollbackAndRespond(res, db, err);
// 						}

// 						const count = results[0].count;

// 						if (count > 0) {
// 							//! User with this user_id already exists, return an error response
// 							return rollbackAndRespond(res, db, null, {
// 								success: false,
// 								message: "Already purchase this bio data",
// 							});
// 						}

// 						const keys = Object.keys(data);
// 						const values = Object.values(data);

// 						//! Insert  into the database
// 						const insertSql = `INSERT INTO contact_purchase_data (${keys.join(
// 							","
// 						)}) VALUES (${generatePlaceholders(values.length)})`;
// 						const contact_purchase_data: string[] = [];
// 						keys.forEach((field) => {
// 							contact_purchase_data.push(data[field]);
// 						});

// 						//! Insert ContactPurchaseData information
// 						db.query(insertSql, contact_purchase_data, (err, results) => {
// 							if (err) {
// 								console.error("Error inserting Contact Purchase Data :", err);
// 								return rollbackAndRespond(res, db, err);
// 							}

// 							const updateUserInfoSql = `UPDATE user_info SET points = points - ? WHERE id=?`;
// 							db.query(updateUserInfoSql, [70, user_id], (err, results) => {
// 								if (err) {
// 									console.error("Error inserting Contact Purchase Data :", err);
// 									return rollbackAndRespond(res, db, err);
// 								}

// 								db.commit((err) => {
// 									if (err) {
// 										console.error("Error committing transaction:", err);
// 										return rollbackAndRespond(res, db, err);
// 									}

// 									res.status(201).json({
// 										success: true,
// 										message: "Contact Purchase Data created successfully",
// 										data: results,
// 									});
// 								});
// 							});
// 						});
// 					}
// 				);
// 			}
// 		);
// 	});
// };

// const updateContactPurchaseData = (req: Request, res: Response) => {
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
// 				//! Check if Expected Life Partner for the user with the given ID exists
// 				const checkUserSql =
// 					"SELECT user_id FROM contact_purchase_data WHERE user_id = ?";

// 				db.query<RowDataPacket[]>(
// 					checkUserSql,
// 					[user_id],
// 					(err, userResults) => {
// 						if (err) {
// 							console.error("Error checking ContactPurchaseData:", err);
// 							db.rollback(() => {
// 								res.status(500).json({ success: false, message: err?.message });
// 							});
// 							return;
// 						}

// 						const userCount = userResults.length;

// 						//! If ContactPurchaseData doesn't exist, send an error response
// 						if (userCount === 0) {
// 							db.rollback(() => {
// 								res.status(404).json({
// 									success: false,
// 									message: "ContactPurchaseData not found",
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
// 						const updateSql = `UPDATE contact_purchase_data SET ${updateFields.join(
// 							", "
// 						)} WHERE user_id = ?`;

// 						updateValues.push(user_id);

// 						// Execute the update query within the transaction
// 						db.query(updateSql, updateValues, (err, results) => {
// 							if (err) {
// 								console.error("Error updating ContactPurchaseData:", err);
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

// const deleteContactPurchaseData = (req: Request, res: Response) => {
// 	const userId = req.params.id; // Assuming you pass the user ID in the URL

// 	// Check if contact_purchase_data for the user with the given ID exists
// 	const checkUserSql =
// 		"SELECT COUNT(*) AS userCount FROM contact_purchase_data WHERE id = ?";
// 	db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
// 		if (err) {
// 			console.error("Error checking contact_purchase_data:", err);
// 			return res.status(500).json({ success: false, message: err?.message });
// 		}

// 		const userCount = userResults[0].userCount;

// 		// If contact_purchase_data doesn't exist, send an error response
// 		if (userCount === 0) {
// 			return res
// 				.status(404)
// 				.json({ success: false, message: "contact_purchase_data not found" });
// 		}

// 		// If contact_purchase_data exists, proceed with the deletion
// 		const deleteSql = "DELETE FROM contact_purchase_data WHERE id = ?";
// 		db.query(deleteSql, [userId], (err, results) => {
// 			if (err) {
// 				console.error("Error deleting contact_purchase_data:", err);
// 				res
// 					.status(500)
// 					.json({ success: false, message: "Internal Server Error" });
// 			} else {
// 				res.status(200).json({
// 					success: true,
// 					message: "contact_purchase_data deleted successfully",
// 				});
// 			}
// 		});
// 	});
// };

// const getContactPurchaseDataByUserId = (req: Request, res: Response) => {
// 	const id = Number(req.params.id); // Assuming the user_id is in the route parameter
// 	const token_id = (req.user?.token_id as JwtPayload) ?? null;
// 	let user_id: number | null = null;

// 	// console.log("token-id-contact_purchase_data", token_id);

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

// 				// console.log(result);
// 				user_id = Number(result[0]?.id);

// 				if (isNaN(user_id) || user_id !== id) {
// 					return rollbackAndRespond(res, db, null, {
// 						success: false,
// 						message: "You are not authorized",
// 						error: err,
// 					});
// 				}

// 				const contact_purchase_dataSql =
// 					"SELECT * FROM contact_purchase_data WHERE user_id = ?";

// 				db.query<RowDataPacket[]>(
// 					contact_purchase_dataSql,
// 					[user_id],
// 					(err, contact_purchase_data) => {
// 						if (err) {
// 							console.error("Error checking ContactPurchaseData:", err);
// 							return rollbackAndRespond(res, db, null, {
// 								success: false,
// 								message: "You are not authorized",
// 								error: err,
// 							});
// 						}
// 						if (contact_purchase_data?.length === 0) {
// 							return res.status(404).json({
// 								message:
// 									"ContactPurchaseData not found for the specified user_id",
// 								success: false,
// 								data: null,
// 							});
// 						}
// 						// Commit the transaction if the update was successful
// 						db.commit(() => {
// 							res.status(200).json({
// 								message: "ContactPurchaseData retrieved successfully",
// 								success: true,
// 								data: contact_purchase_data[0],
// 							});
// 						});
// 					}
// 				);
// 			}
// 		);
// 	});
// };
// const getContactPurchaseDataForBuyer = (req: Request, res: Response) => {
// 	const id = Number(req.params.userId); // Assuming the user_id is in the route parameter
// 	const bio_id = Number(req.params.bioId);
// 	const token_id = (req.user?.token_id as JwtPayload) ?? null;
// 	let user_id: number | null = null;

// 	// console.log("token-id-contact_purchase_data", token_id);

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

// 				// console.log(result);
// 				user_id = Number(result[0]?.id);

// 				if (isNaN(user_id) || user_id !== id) {
// 					return rollbackAndRespond(res, db, null, {
// 						success: false,
// 						message: "You are not authorized",
// 						error: err,
// 					});
// 				}

// 				const contact_purchase_dataSql =
// 					"SELECT COUNT(*) as row_count,p.status as payment_status, p.refund_status as refund_status,c.full_name,c.family_number,c.relation FROM payments p  INNER JOIN contact_purchase_data_purchase_data cpd on (p.user_id=cpd.user_id AND p.transaction_id=cpd.transaction_id) INNER JOIN `bio_choice_data` bcd ON (bcd.user_id= cpd.user_id AND bcd.bio_id=cpd.bio_id AND cpd.user_id=p.user_id) LEFT JOIN contact_purchase_data c ON (bcd.bio_id=c.user_id AND cpd.bio_id=c.user_id) WHERE p.status='Completed' AND p.refund_status NOT LIKE '%processing%' AND p.refund_status NOT LIKE '%refunded%' AND p.reason='contact_purchase_data_purchase' AND p.user_id=? AND cpd.bio_id=?";

// 				db.query<RowDataPacket[]>(
// 					contact_purchase_dataSql,
// 					[user_id, bio_id],
// 					(err, contact_purchase_data) => {
// 						if (err) {
// 							console.error("Error checking :", err);
// 							return rollbackAndRespond(res, db, null, {
// 								success: false,
// 								message: "You are not authorized",
// 								error: err,
// 							});
// 						}

// 						if (contact_purchase_data[0]?.row_count >= 1) {
// 							const getContactPurchaseDataSql = `select * from contact_purchase_data where user_id = ?`;
// 							db.query<RowDataPacket[]>(
// 								getContactPurchaseDataSql,
// 								[bio_id],
// 								(err, contact_purchase_data) => {
// 									if (err) {
// 										return rollbackAndRespond(res, db, null, {
// 											success: false,
// 											message: err?.message,
// 											error: err,
// 										});
// 									}

// 									db.commit(() => {
// 										res.status(200).json({
// 											message: "ContactPurchaseData retrieved successfully",
// 											success: true,
// 											data: contact_purchase_data[0],
// 										});
// 									});
// 								}
// 							);
// 						} else {
// 							// Commit the transaction if the update was successful
// 							db.commit(() => {
// 								res.status(200).json({
// 									message: "ContactPurchaseData retrieved successfully",
// 									success: true,
// 									data: null,
// 								});
// 							});
// 						}
// 					}
// 				);
// 			}
// 		);
// 	});
// };

// export const ContactPurchaseDataController = {
// 	getContactPurchaseData,
// 	getSingleContactPurchaseData,
// 	createContactPurchaseData,
// 	updateContactPurchaseData,
// 	deleteContactPurchaseData,
// 	getContactPurchaseDataByUserId,
// 	getContactPurchaseDataForBuyer,
// };
