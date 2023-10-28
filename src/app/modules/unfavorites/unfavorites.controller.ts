import { Request, Response } from "express";
import db from "../../../config/db";
import { RowDataPacket } from "mysql2";
import { sendSuccess } from "../../../shared/SendSuccess";
import { generatePlaceholders } from "../../../utils/generatePlaceholders";

import httpStatus from "http-status";
import { rollbackAndRespond } from "../../../utils/response";
import { JwtPayload } from "jsonwebtoken";

const getUnFavoritesListByUserId = (req: Request, res: Response) => {
	const token_id = req.user?.token_id;
	let user_id: string | null = null;
	if (!token_id) {
		return res.status(401).send({
			statusCode: httpStatus.UNAUTHORIZED,
			message: "You are not authorized",
			success: false,
		});
	}
	//! Get user_id using token_id
	const getUserIdByTokenSql = `SELECT id FROM user_info WHERE token_id = ?`;
	db.query<RowDataPacket[]>(getUserIdByTokenSql, [token_id], (err, result) => {
		if (err) {
			return rollbackAndRespond(res, db, null, {
				success: false,
				message: "You are not authorized",
				error: err,
			});
		}

		user_id = result[0]?.id;

		//? get all bio data that likes an users
		// const sql1 = `SELECT unfavorites.user_id,unfavorites.bio_id,address.permanent_address, general_info.date_of_birth,general_info.screen_color  from unfavorites
		// 	LEFT JOIN address ON unfavorites.bio_id = address.user_id
		// 	LEFT JOIN general_info ON unfavorites.bio_id = general_info.user_id
		// 	LEFT JOIN bio_choice_data ON unfavorites.bio_id = bio_choice_data.user_id
		// 	where unfavorites.user_id = ?
		// 	`;
		const sql1 = `SELECT DISTINCT
    f.user_id,
    f.bio_id,
    a.permanent_address,
    gf.date_of_birth,
    gf.screen_color,
    (
        SELECT COUNT(*) *100
        FROM bio_choice_data bc 
        WHERE bc.bio_id = f.bio_id
    ) AS total_count,
    (
        SELECT COUNT(*) 
        FROM bio_choice_data bc 
        WHERE (bc.bio_id = f.bio_id AND bc.status = 'Pending') OR (bc.bio_id = f.bio_id AND bc.status = 'pending')
    ) AS total_pending,
    (
        SELECT COUNT(*) 
        FROM bio_choice_data bc 
        WHERE (bc.bio_id = f.bio_id AND bc.status = 'Approved') OR (bc.bio_id = f.bio_id AND bc.status = 'approved')
    ) AS total_approved, 
    (
        SELECT COUNT(*) 
        FROM bio_choice_data bc 
        WHERE (bc.bio_id = f.bio_id AND bc.status = 'Rejected') OR (bc.bio_id = f.bio_id AND bc.status = 'rejected')
    ) AS total_rejected,
    COALESCE(
        (
            SELECT (COUNT(*) * 100)
            FROM bio_choice_data bc 
            WHERE (bc.bio_id = f.bio_id AND bc.status = 'Approved') OR (bc.bio_id = f.bio_id AND bc.status = 'approved')
        ) / (
            SELECT COUNT(*) 
            FROM bio_choice_data bc 
            WHERE bc.bio_id = f.bio_id
        ), 0
    ) AS approval_rate,
    COALESCE(
        (
            SELECT (COUNT(*) * 100)
            FROM bio_choice_data bc 
            WHERE (bc.bio_id = f.bio_id AND bc.status = 'Rejected') OR (bc.bio_id = f.bio_id AND bc.status = 'rejected')
        ) / (
            SELECT COUNT(*) 
            FROM bio_choice_data bc 
            WHERE bc.bio_id = f.bio_id
        ), 0
    ) AS rejection_rate
FROM unfavorites AS f
JOIN address AS a ON f.bio_id = a.user_id
JOIN general_info AS gf ON f.bio_id = gf.user_id
WHERE f.user_id = ? AND f.bio_id <> ?`;
		db.query<RowDataPacket[]>(sql1, [user_id, user_id], (err, result) => {
			if (err) {
				console.error("Error updating unfavorites:", err);
				return rollbackAndRespond(res, db, err);
			}

			db.commit((err) => {
				if (err) {
					console.error("Error committing transaction:", err);
					return rollbackAndRespond(res, db, err);
				}
				res.status(201).json({
					success: true,
					message: "UnFavorites created successfully",
					data: result,
				});
			});
		});
	});
};

const getUnFavoritesByUserId = (req: Request, res: Response) => {
	const user_id = req.params.userId;
	const bio_id = req.params.bioId;
	const sql = "SELECT type FROM unfavorites WHERE user_id = ? AND bio_id = ?";
	db.query<RowDataPacket[]>(sql, [user_id, bio_id], (err, rows) => {
		if (err) {
			return res.send({
				message: err?.message,
				success: false,
			});
		}

		res
			.status(200)
			.json(
				sendSuccess<RowDataPacket>(
					"unfavorites  retrieved successfully",
					rows[0]
				)
			);
	});
};

const getUnFavoritesCountByBioId = (req: Request, res: Response) => {
	const bio_id = req.params.id;
	console.log(bio_id);
	const sql =
		"SELECT COUNT(*) AS count FROM unfavorites WHERE bio_id = ? AND type = ?"; // Updated SQL query

	db.query<RowDataPacket[]>(sql, [bio_id, "like"], (err, rows) => {
		console.log(err);
		if (err) {
			return res.send({
				message: err?.message,
				success: false,
			});
		}

		const count = rows[0].count; // Extract the count from the result

		res.status(200).json({
			success: true,
			count: count,
		});
	});
};

const getSingleUnFavorites = (req: Request, res: Response) => {
	const userId = req.params.id; // Assuming you pass the user ID as a route parameter
	const sql = "SELECT * FROM unfavorites WHERE id = ?";

	db.query<RowDataPacket[]>(sql, [userId], (err, rows) => {
		if (err) {
			return res.status(500).json({
				message: err?.message,
				success: false,
			});
		}

		if (rows.length === 0) {
			return res.status(404).json({
				message: "unfavorites not found",
				success: false,
			});
		}

		res
			.status(200)
			.json(sendSuccess<RowDataPacket[]>("unfavorites retrieved", rows, 200));
	});
};
const createUnFavorites = (req: Request, res: Response) => {
	const { bio_id } = req.body;
	const token_id = req.user?.token_id;
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

				//? get type from unfavorites

				const getTypeSql =
					"SELECT type from unfavorites where user_id = ? AND bio_id = ?";
				db.query<RowDataPacket[]>(
					getTypeSql,
					[user_id, bio_id],
					(err, result) => {
						if (err) {
							console.error("Error updating unfavorites:", err);
							return rollbackAndRespond(res, db, err);
						}

						//! If existing type is 'gnore', update it to 'not-ignore', and vice versa
						if (result.length) {
							const newType =
								result[0]?.type === "ignore" ? "not-ignore" : "ignore";
							const updateSql = `UPDATE unfavorites SET type=?  WHERE user_id = ? AND bio_id=?`;
							db.query(
								updateSql,
								[newType, user_id, bio_id],
								(err, results) => {
									if (err) {
										console.error("Error updating unfavorites:", err);
										return rollbackAndRespond(res, db, err);
									}

									db.commit((err) => {
										if (err) {
											console.error("Error committing transaction:", err);
											return rollbackAndRespond(res, db, err);
										}

										res.status(201).json({
											success: true,
											message: "UnFavorites updated successfully",
											data: results,
										});
									});
								}
							);
						} else {
							const createSql = `Insert into unfavorites(user_id,bio_id,type) values(?,?,?)`;
							db.query(
								createSql,
								[user_id, bio_id, "ignore"],
								(err, results) => {
									if (err) {
										console.error("Error updating unfavorites:", err);
										return rollbackAndRespond(res, db, err);
									}

									db.commit((err) => {
										if (err) {
											console.error("Error committing transaction:", err);
											return rollbackAndRespond(res, db, err);
										}
										res.status(201).json({
											success: true,
											message: "UnFavorites created successfully",
											data: results,
										});
									});
								}
							);
						}
					}
				);
			}
		);
	});
};

const updateUnFavorites = (req: Request, res: Response) => {
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
				const checkUserSql =
					"SELECT user_id FROM unfavorites WHERE user_id = ?";

				db.query<RowDataPacket[]>(
					checkUserSql,
					[user_id],
					(err, userResults) => {
						if (err) {
							console.error("Error checking UnFavorites:", err);
							db.rollback(() => {
								res.status(500).json({ success: false, message: err?.message });
							});
							return;
						}

						const userCount = userResults.length;

						//! If UnFavorites doesn't exist, send an error response
						if (userCount === 0) {
							db.rollback(() => {
								res.status(404).json({
									success: false,
									message: "UnFavorites not found",
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
						const updateSql = `UPDATE unfavorites SET ${updateFields.join(
							", "
						)} WHERE user_id = ?`;

						updateValues.push(user_id);

						// Execute the update query within the transaction
						db.query(updateSql, updateValues, (err, results) => {
							if (err) {
								console.error("Error updating UnFavorites:", err);
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

const deleteUnFavorites = (req: Request, res: Response) => {
	const userId = req.params.id; // Assuming you pass the user ID in the URL

	// Check if unfavorites for the user with the given ID exists
	const checkUserSql =
		"SELECT COUNT(*) AS userCount FROM unfavorites WHERE id = ?";
	db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
		if (err) {
			console.error("Error checking unfavorites:", err);
			return res.status(500).json({ success: false, message: err?.message });
		}

		const userCount = userResults[0].userCount;

		// If unfavorites doesn't exist, send an error response
		if (userCount === 0) {
			return res
				.status(404)
				.json({ success: false, message: "unfavorites not found" });
		}

		// If unfavorites exists, proceed with the deletion
		const deleteSql = "DELETE FROM unfavorites WHERE id = ?";
		db.query(deleteSql, [userId], (err, results) => {
			if (err) {
				console.error("Error deleting unfavorites:", err);
				res
					.status(500)
					.json({ success: false, message: "Internal Server Error" });
			} else {
				res
					.status(200)
					.json({ success: true, message: "unfavorites deleted successfully" });
			}
		});
	});
};

export const UnFavoritesController = {
	getSingleUnFavorites,
	createUnFavorites,
	updateUnFavorites,
	deleteUnFavorites,
	getUnFavoritesByUserId,
	getUnFavoritesCountByBioId,
	getUnFavoritesListByUserId,
};
