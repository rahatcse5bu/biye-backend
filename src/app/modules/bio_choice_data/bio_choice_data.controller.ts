import { Request, Response } from "express";
import db from "../../../config/db";
import { RowDataPacket } from "mysql2";
import { sendSuccess } from "../../../shared/SendSuccess";
import { generatePlaceholders } from "../../../utils/generatePlaceholders";
import { BioChoiceDataFields } from "./bio_choice_data.constant";
import { rollbackAndRespond } from "../../../utils/response";

const getBioChoiceData = (req: Request, res: Response) => {
	const sql = "SELECT * FROM bio_choice_data";
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
					"All Bio choice data  retrieved successfully",
					rows
				)
			);
	});
};

const getBioChoiceStatisticsData = (req: Request, res: Response) => {
	const bioId = req.params.id;
	const rejectedSql = `SELECT COUNT(*) AS rejectedCount FROM bio_choice_data WHERE status = 'rejected' AND user_id =? `;
	let responseResults = {};
	db.beginTransaction((err) => {
		if (err) {
			return rollbackAndRespond(res, db, null, {
				success: false,
				message: "Something went wrong",
				error: err,
			});
		}

		db.query<RowDataPacket[]>(rejectedSql, [bioId], (err, results) => {
			if (err) {
				return rollbackAndRespond(res, db, null, {
					success: false,
					message: "Something went wrong",
					error: err,
				});
			}

			responseResults = {
				...responseResults,
				rejected: results[0]?.rejectedCount,
			};

			const approvedSql = `SELECT COUNT(*) AS approvedCount FROM bio_choice_data WHERE status = 'approved' AND user_id=? `;
			db.query<RowDataPacket[]>(approvedSql, [bioId], (err, results) => {
				if (err) {
					return db.rollback(() => {
						res.send({
							message: err?.message,
							success: false,
							error: err,
						});
					});
				}

				responseResults = {
					...responseResults,
					approved: results[0]?.approvedCount,
				};

				const pendingSql = `SELECT COUNT(*) AS pendingCount FROM bio_choice_data WHERE status = 'pending' AND user_id=? `;
				db.query<RowDataPacket[]>(pendingSql, [bioId], (err, results) => {
					if (err) {
						return db.rollback(() => {
							res.send({
								message: err?.message,
								success: false,
								error: err,
							});
						});
					}

					responseResults = {
						...responseResults,
						pending: results[0]?.pendingCount,
					};

					db.commit((err) => {
						if (err) {
							return db.rollback(() => {
								throw err;
							});
						}
						res.status(200).json({
							success: true,
							results: responseResults,
							message: "All statistics retrieve successfully",
						});
					});
				});
			});
		});
	});
};

const getSingleBioChoiceData = (req: Request, res: Response) => {
	const userId = req.params.id; // Assuming you pass the user ID as a route parameter
	const sql = "SELECT * FROM bio_choice_data WHERE id = ?";

	db.query<RowDataPacket[]>(sql, [userId], (err, rows) => {
		if (err) {
			return res.status(500).json({
				message: err?.message,
				success: false,
			});
		}

		if (rows.length === 0) {
			return res.status(404).json({
				message: "Bio choice data not found",
				success: false,
			});
		}

		res
			.status(200)
			.json(
				sendSuccess<RowDataPacket[]>("Bio choice data retrieved", rows, 200)
			);
	});
};

const createBioChoiceData = (req: Request, res: Response) => {
	const data = req.body;
	// Insert bio_choice_datarmation into the database
	const insertSql = `INSERT INTO bio_choice_data (
    	${BioChoiceDataFields.join(",")}
  ) VALUES (${generatePlaceholders(BioChoiceDataFields.length)})`;

	const BioChoiceData: string[] = [];
	BioChoiceDataFields.forEach((field) => {
		BioChoiceData.push(data[field]);
	});

	db.query(insertSql, BioChoiceData, (err, results) => {
		if (err) {
			console.error("Error inserting Bio choice data:", err);
			res
				.status(500)
				.json({ success: false, message: "Internal Server Error" });
		} else {
			res.status(201).json({
				success: true,
				message: "Bio choice data created successfully",
			});
		}
	});
};

const updateBioChoiceData = (req: Request, res: Response) => {
	const data = req.body;
	const userId = req.params.id; // Assuming you pass the user ID in the URL

	//   console.log(data);

	// Begin a database transaction
	db.beginTransaction((err) => {
		if (err) {
			console.error("Error starting transaction:", err);
			return res
				.status(500)
				.json({ success: false, message: "Internal Server Error" });
		}

		// Check if Bio choice data for the user with the given ID exists
		const checkUserSql = "SELECT * FROM bio_choice_data WHERE id = ?";
		db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
			if (err) {
				console.error("Error checking Bio choice data:", err);
				db.rollback(() => {
					res.status(500).json({ success: false, message: err?.message });
				});
				return;
			}

			const userCount = userResults.length;

			// If Bio choice data doesn't exist, send an error response
			if (userCount === 0) {
				db.rollback(() => {
					res.status(404).json({
						success: false,
						message: "Bio choice data not found",
					});
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
			const updateSql = `UPDATE bio_choice_data SET ${updateFields.join(
				", "
			)} WHERE id = ?`;

			updateValues.push(userId);

			// Execute the update query within the transaction
			db.query(updateSql, updateValues, (err, results) => {
				if (err) {
					console.error("Error updating Bio choice data:", err);
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

const deleteBioChoiceData = (req: Request, res: Response) => {
	const userId = req.params.id; // Assuming you pass the user ID in the URL

	// Check if bio_choice_data for the user with the given ID exists
	const checkUserSql =
		"SELECT COUNT(*) AS userCount FROM bio_choice_data WHERE id = ?";
	db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
		if (err) {
			console.error("Error checking Bio choice data:", err);
			return res.status(500).json({ success: false, message: err?.message });
		}

		const userCount = userResults[0].userCount;

		// If bio_choice_data doesn't exist, send an error response
		if (userCount === 0) {
			return res.status(404).json({
				success: false,
				message: "bio_choice_data not found",
			});
		}

		// If Bio choice data exists, proceed with the deletion
		const deleteSql = "DELETE FROM bio_choice_data WHERE id = ?";
		db.query(deleteSql, [userId], (err, results) => {
			if (err) {
				console.error("Error deleting Bio choice data:", err);
				res
					.status(500)
					.json({ success: false, message: "Internal Server Error" });
			} else {
				res.status(200).json({
					success: true,
					message: "Bio choice data deleted successfully",
				});
			}
		});
	});
};

export const BioChoiceDataController = {
	getBioChoiceData,
	getSingleBioChoiceData,
	createBioChoiceData,
	updateBioChoiceData,
	deleteBioChoiceData,
	getBioChoiceStatisticsData,
};
