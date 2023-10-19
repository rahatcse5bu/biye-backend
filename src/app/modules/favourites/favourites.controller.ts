import { Request, Response } from "express";
import db from "../../../config/db";
import { RowDataPacket } from "mysql2";
import { sendSuccess } from "../../../shared/SendSuccess";
import { generatePlaceholders } from "../../../utils/generatePlaceholders";
import { FavouritesFields } from "./favourites.constant";
import httpStatus from "http-status";
import { rollbackAndRespond } from "../../../utils/response";
import { JwtPayload } from "jsonwebtoken";

const getFavourites = (req: Request, res: Response) => {
	const sql = "SELECT * FROM favourites";
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
					"All favourites  retrieved successfully",
					rows
				)
			);
	});
};

const getSingleFavourites = (req: Request, res: Response) => {
	const userId = req.params.id; // Assuming you pass the user ID as a route parameter
	const sql = "SELECT * FROM favourites WHERE id = ?";

	db.query<RowDataPacket[]>(sql, [userId], (err, rows) => {
		if (err) {
			return res.status(500).json({
				message: err?.message,
				success: false,
			});
		}

		if (rows.length === 0) {
			return res.status(404).json({
				message: "favourites not found",
				success: false,
			});
		}

		res
			.status(200)
			.json(sendSuccess<RowDataPacket[]>("favourites retrieved", rows, 200));
	});
};

const createFavourites = (req: Request, res: Response) => {
	const data = req.body;
	const token_id = req.user?.token_id;
	let { ...others } = data;
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
					"SELECT COUNT(*) AS favouritesCount FROM favourites WHERE user_id = ?";

				db.query<RowDataPacket[]>(checkSql, [user_id], (err, results) => {
					if (err) {
						console.error("Error checking User Id:", err);
						return rollbackAndRespond(res, db, err);
					}

					const count = results[0].favouritesCount;

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
					const insertSql = `INSERT INTO favourites (${keys.join(
						","
					)}) VALUES (${generatePlaceholders(values.length)})`;
					const favourites: string[] = [];
					keys.forEach((field) => {
						favourites.push(others[field]);
					});

					//! Insert favourites information
					db.query(insertSql, favourites, (err, results) => {
						if (err) {
							console.error("Error inserting  favourites:", err);
							return rollbackAndRespond(res, db, err);
						}

						db.commit((err) => {
							if (err) {
								console.error("Error committing transaction:", err);
								return rollbackAndRespond(res, db, err);
							}

							res.status(201).json({
								success: true,
								message:
									"Favourites created and user_info updated successfully",
							});
						});
					});
				});
			}
		);
	});
};

const updateFavourites = (req: Request, res: Response) => {
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
				const checkUserSql = "SELECT user_id FROM favourites WHERE user_id = ?";

				db.query<RowDataPacket[]>(
					checkUserSql,
					[user_id],
					(err, userResults) => {
						if (err) {
							console.error("Error checking Favourites:", err);
							db.rollback(() => {
								res.status(500).json({ success: false, message: err?.message });
							});
							return;
						}

						const userCount = userResults.length;

						//! If Favourites doesn't exist, send an error response
						if (userCount === 0) {
							db.rollback(() => {
								res.status(404).json({
									success: false,
									message: "Favourites not found",
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
						const updateSql = `UPDATE favourites SET ${updateFields.join(
							", "
						)} WHERE user_id = ?`;

						updateValues.push(user_id);

						// Execute the update query within the transaction
						db.query(updateSql, updateValues, (err, results) => {
							if (err) {
								console.error("Error updating Favourites:", err);
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

const deleteFavourites = (req: Request, res: Response) => {
	const userId = req.params.id; // Assuming you pass the user ID in the URL

	// Check if favourites for the user with the given ID exists
	const checkUserSql =
		"SELECT COUNT(*) AS userCount FROM favourites WHERE id = ?";
	db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
		if (err) {
			console.error("Error checking favourites:", err);
			return res.status(500).json({ success: false, message: err?.message });
		}

		const userCount = userResults[0].userCount;

		// If favourites doesn't exist, send an error response
		if (userCount === 0) {
			return res
				.status(404)
				.json({ success: false, message: "favourites not found" });
		}

		// If favourites exists, proceed with the deletion
		const deleteSql = "DELETE FROM favourites WHERE id = ?";
		db.query(deleteSql, [userId], (err, results) => {
			if (err) {
				console.error("Error deleting favourites:", err);
				res
					.status(500)
					.json({ success: false, message: "Internal Server Error" });
			} else {
				res
					.status(200)
					.json({ success: true, message: "favourites deleted successfully" });
			}
		});
	});
};
const getFavouritesByUserId = (req: Request, res: Response) => {
	const userId = req.params.id; // Assuming the user_id is in the route parameter
	const sql = "SELECT * FROM favourites WHERE user_id = ?";
	db.query<RowDataPacket[]>(sql, [userId], (err, rows) => {
		if (err) {
			res.send({
				message: err?.message,
				success: false,
			});
		} else {
			if (rows.length === 0) {
				res.status(404).json({
					message: "Favourites not found for the specified user_id",
					success: false,
				});
			} else {
				res.status(200).json({
					message: "Favourites retrieved successfully",
					success: true,
					data: rows[0], // Assuming you expect only one row per user_id
				});
			}
		}
	});
};
export const FavouritesController = {
	getFavourites,
	getSingleFavourites,
	createFavourites,
	updateFavourites,
	deleteFavourites,
	getFavouritesByUserId,
};
