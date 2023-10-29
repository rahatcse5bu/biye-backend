import { Request, Response } from "express";
import db from "../../../config/db";
import { RowDataPacket } from "mysql2";
import { sendSuccess } from "../../../shared/SendSuccess";
import { generatePlaceholders } from "../../../utils/generatePlaceholders";
import { rollbackAndRespond } from "../../../utils/response";
import httpStatus from "http-status";

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
	const rejectedSql = `SELECT COUNT(*) AS rejectedCount FROM bio_choice_data WHERE status = 'Rejected' AND bio_id =? `;
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

			const approvedSql = `SELECT COUNT(*) AS approvedCount FROM bio_choice_data WHERE status = 'Approved' AND bio_id=? `;
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

				const pendingSql = `SELECT COUNT(*) AS pendingCount FROM bio_choice_data WHERE status = 'Pending' AND bio_id=? `;
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
	let data = req.body;
	const token_id = req.user?.token_id;
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

				if (!user_id) {
					return rollbackAndRespond(res, db, null, {
						success: false,
						message: "You are not authorized",
						error: err,
					});
				}

				//! Check if the user_id already exists in the database
				const checkSql =
					"SELECT COUNT(*) AS count FROM bio_choice_data WHERE user_id = ? AND bio_id = ?";

				db.query<RowDataPacket[]>(
					checkSql,
					[user_id, data?.bio_id],
					(err, results) => {
						if (err) {
							console.error("Error checking User Id:", err);
							return rollbackAndRespond(res, db, err);
						}

						const count = results[0].count;

						if (count > 0) {
							//! User with this user_id already exists, return an error response
							return rollbackAndRespond(res, db, null, {
								success: false,
								message: "You already requested",
							});
						}

						data = {
							...data,
							user_id,
						};

						const keys = Object.keys(data);
						const values = Object.values(data);

						//! Insert  into the database
						const insertSql = `INSERT INTO bio_choice_data (${keys.join(
							","
						)}) VALUES (${generatePlaceholders(values.length)})`;
						const bio_choice_data: string[] = [];
						keys.forEach((field) => {
							bio_choice_data.push(data[field]);
						});

						//! Insert bio choice data  information
						db.query(insertSql, bio_choice_data, (err, results) => {
							if (err) {
								console.error("Error inserting Occupation:", err);
								return rollbackAndRespond(res, db, err);
							}
							// ! reduced points
							const updateUserInfoSql = `UPDATE user_info SET points = points - ? WHERE id=?`;
							db.query(updateUserInfoSql, [30, user_id], (err, results) => {
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
										message: "Bio Choice data created successfully",
									});
								});
							});
						});
					}
				);
			}
		);
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

const getBioChoiceDataOfFirstStep = (req: Request, res: Response) => {
	const token_id = req.user?.token_id;
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

				if (!user_id) {
					return rollbackAndRespond(res, db, null, {
						success: false,
						message: "You are not authorized",
						error: err,
					});
				}

				//! get bio choice data first step
				const getSqlFirstStep = `
				SELECT subquery.bio_id,a.permanent_area,a.present_area,a.zilla,a.upzilla,a.division,a.city,
				subquery.status,subquery.feedback,
				COUNT(main.user_id) AS total_count,
				SUM(CASE WHEN main.status = 'Approved' THEN 1 ELSE 0 END) AS approval_count,
				SUM(CASE WHEN main.status = 'Rejected' THEN 1 ELSE 0 END) AS rejection_count,
				SUM(CASE WHEN main.status = 'Pending' THEN 1 ELSE 0 END) AS pending_count,
				CASE
        WHEN COUNT(main.user_id) - SUM(CASE WHEN main.status = 'Pending' THEN 1 ELSE 0 END) = 0
        THEN 0.0
        ELSE
            (
                SUM(CASE WHEN main.status = 'Approved' THEN 1 ELSE 0 END) * 100.0
            ) / (
                COUNT(main.user_id) - SUM(CASE WHEN main.status = 'Pending' THEN 1 ELSE 0 END)
            )
				END AS approval_rate,
				CASE
        WHEN COUNT(main.user_id) - SUM(CASE WHEN main.status = 'Pending' THEN 1 ELSE 0 END) = 0
        THEN 0.0
        ELSE
            (
                SUM(CASE WHEN main.status = 'Rejected' THEN 1 ELSE 0 END) * 100.0
            ) / (
                COUNT(main.user_id) - SUM(CASE WHEN main.status = 'Pending' THEN 1 ELSE 0 END)
            )
								END AS rejection_rate
						FROM (
								SELECT DISTINCT *
								FROM bio_choice_data
								WHERE user_id = ? AND bio_id <> ?
						) AS subquery
						LEFT JOIN bio_choice_data AS main ON subquery.bio_id = main.user_id LEFT JOIN address a ON a.user_id=subquery.bio_id
						GROUP BY subquery.bio_id;
				
				`;

				db.query<RowDataPacket[]>(
					getSqlFirstStep,
					[user_id, user_id],
					(err, results) => {
						if (err) {
							console.error("Error checking User Id:", err);
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
								message: "Bio Choice first step data get successfully",
								data: results,
							});
						});
					}
				);
			}
		);
	});
};
const getBioChoiceDataOfSecondStep = (req: Request, res: Response) => {
	const token_id = req.user?.token_id;
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

				if (!user_id) {
					return rollbackAndRespond(res, db, null, {
						success: false,
						message: "You are not authorized",
						error: err,
					});
				}

				//! get bio choice data of second step

				const getSqlSecondStep = `
				SELECT
    subquery.bio_id,p.reason,a.permanent_area as permanent_address,a.present_area as present_address,a.zilla as zilla,a.upzilla as upzilla,a.division as divison,a.city as city,gi.date_of_birth as date_of_birth, c.full_name,c.family_number,c.relation,
    subquery.status as choice_bio_status,subquery.feedback,
    COUNT(main.user_id) AS total_count,
    SUM(CASE WHEN main.status = 'Approved' THEN 1 ELSE 0 END) AS approval_count,
    SUM(CASE WHEN main.status = 'Rejected' THEN 1 ELSE 0 END) AS rejection_count,
    SUM(CASE WHEN main.status = 'Pending' THEN 1 ELSE 0 END) AS pending_count,
    CASE
        WHEN COUNT(main.user_id) - SUM(CASE WHEN main.status = 'Pending' THEN 1 ELSE 0 END) = 0
        THEN 0.0
        ELSE
            (
                SUM(CASE WHEN main.status = 'Approved' THEN 1 ELSE 0 END) * 100.0
            ) / (
                COUNT(main.user_id) - SUM(CASE WHEN main.status = 'Pending' THEN 1 ELSE 0 END)
            )
    END AS approval_rate,
    CASE
        WHEN COUNT(main.user_id) - SUM(CASE WHEN main.status = 'Pending' THEN 1 ELSE 0 END) = 0
        THEN 0.0
        ELSE
            (
                SUM(CASE WHEN main.status = 'Rejected' THEN 1 ELSE 0 END) * 100.0
            ) / (
                COUNT(main.user_id) - SUM(CASE WHEN main.status = 'Pending' THEN 1 ELSE 0 END)
            )
						END AS rejection_rate
				FROM (
						SELECT DISTINCT *
						FROM bio_choice_data
						WHERE user_id = ? AND bio_id <> ?
				) AS subquery
				LEFT JOIN bio_choice_data AS main ON subquery.bio_id = main.user_id LEFT JOIN address a ON a.user_id=subquery.bio_id LEFT JOIN contact c on c.user_id=subquery.bio_id LEFT JOIN  general_info gi ON gi.user_id=subquery.bio_id LEFT JOIN contact_purchase_data cpd ON cpd.user_id=? LEFT JOIN payments p ON (p.user_id= ? AND p.transaction_id=cpd.transaction_id AND cpd.bio_id=subquery.bio_id) WHERE (p.reason='contact_purchase' AND p.status='Completed' AND p.refund_status <> 'refunded' OR p.refund_status NOT LIKE '%processing%') AND subquery.status='Approved'
				GROUP BY subquery.bio_id;
				`;

				db.query<RowDataPacket[]>(
					getSqlSecondStep,
					[user_id, user_id, user_id, user_id],
					(err, results) => {
						if (err) {
							console.error("Error checking User Id:", err);
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
								message: "Bio Choice second step data get successfully",
								data: results,
							});
						});
					}
				);
			}
		);
	});
};
const getBioChoiceDataOfShare = (req: Request, res: Response) => {
	const token_id = req.user?.token_id;
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

				if (!user_id) {
					return rollbackAndRespond(res, db, null, {
						success: false,
						message: "You are not authorized",
						error: err,
					});
				}

				//! get bio choice data of share

				const getSqlOfShare = `
				SELECT DISTINCT bc.user_id, gi.date_of_birth as date_of_birth,bc.bio_details, bc.status, bc.feedback,address.present_address,address.city,address.present_area FROM bio_choice_data as bc LEFT JOIN general_info as gi ON gi.user_id = bc.user_id LEFT JOIN address ON address.user_id = bc.user_id WHERE bc.user_id IN ( SELECT DISTINCT user_id FROM bio_choice_data WHERE bio_id = ? AND user_id <> ? ) GROUP By bc.user_id;?
				)
				`;

				db.query<RowDataPacket[]>(
					getSqlOfShare,
					[user_id, user_id],
					(err, results) => {
						if (err) {
							console.error("Error checking User Id:", err);
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
								message: "Bio Choice of share data get successfully",
								data: results,
							});
						});
					}
				);
			}
		);
	});
};

const checkBioChoiceDataOfFirstStep = (req: Request, res: Response) => {
	const token_id = req.user?.token_id;
	const bio_id = req.params.id;
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

				if (!user_id) {
					return rollbackAndRespond(res, db, null, {
						success: false,
						message: "You are not authorized",
						error: err,
					});
				}

				//! get bio choice data of second step

				const checkSqlFirstStep =
					"SELECT COUNT(*) as count , bcd.status FROM `bio_choice_data` bcd WHERE bcd.user_id= ? AND bcd.bio_id = ?";

				db.query<RowDataPacket[]>(
					checkSqlFirstStep,
					[user_id, bio_id],
					(err, results) => {
						if (err) {
							console.error("Error checking User Id:", err);
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
								message: "Bio Choice check first step data get successfully",
								data: results,
							});
						});
					}
				);
			}
		);
	});
};
const checkBioChoiceDataOfSecondStep = (req: Request, res: Response) => {
	const token_id = req.user?.token_id;
	const bio_id = req.params.id;
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

				if (!user_id) {
					return rollbackAndRespond(res, db, null, {
						success: false,
						message: "You are not authorized",
						error: err,
					});
				}

				//! get bio choice data of second step

				const checkSqlSecondStep =
					"SELECT COUNT(*) as count,p.status as payment_status, p.refund_status as refund_status FROM payments p LEFT JOIN contact_purchase_data cpd on (p.user_id=cpd.user_id AND p.transaction_id=cpd.transaction_id) WHERE p.status='Completed' AND p.refund_status NOT LIKE '%processing%' AND p.reason='contact_purchase' AND p.user_id=? AND cpd.bio_id=?";

				db.query<RowDataPacket[]>(
					checkSqlSecondStep,
					[user_id, bio_id],
					(err, results) => {
						if (err) {
							console.error("Error checking User Id:", err);
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
								message: "Bio Choice check second step data get successfully",
								data: results,
							});
						});
					}
				);
			}
		);
	});
};

export const BioChoiceDataController = {
	getBioChoiceData,
	getSingleBioChoiceData,
	createBioChoiceData,
	updateBioChoiceData,
	deleteBioChoiceData,
	getBioChoiceStatisticsData,
	getBioChoiceDataOfFirstStep,
	getBioChoiceDataOfSecondStep,
	checkBioChoiceDataOfFirstStep,
	checkBioChoiceDataOfSecondStep,
	getBioChoiceDataOfShare,
};
