import { Request, Response } from "express";
import db from "../../../config/db";
import { RowDataPacket } from "mysql2";
import { sendSuccess } from "../../../shared/SendSuccess";
import { generatePlaceholders } from "../../../utils/generatePlaceholders";
import {  RefundFields } from "./refunds.constant";
import httpStatus from "http-status";
import { rollbackAndRespond } from "../../../utils/response";
import { JwtPayload } from "jsonwebtoken";

const getRefundList = (req: Request, res: Response) => {
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
		// const sql1 = `SELECT favourites.user_id,favourites.bio_id,address.permanent_address, general_info.date_of_birth,general_info.screen_color  from favourites
		// 	LEFT JOIN address ON favourites.bio_id = address.user_id
		// 	LEFT JOIN general_info ON favourites.bio_id = general_info.user_id
		// 	LEFT JOIN bio_choice_data ON favourites.bio_id = bio_choice_data.user_id
		// 	where favourites.user_id = ?
		// 	`;
		const sql1 = "SELECT * FROM `refunds` where refund_status='requested'";
		db.query<RowDataPacket[]>(sql1, [user_id, user_id], (err, result) => {
			if (err) {
				console.error("Error updating Refund:", err);
				return rollbackAndRespond(res, db, err);
			}

			db.commit((err) => {
				if (err) {
					console.error("Error committing transaction:", err);
					return rollbackAndRespond(res, db, err);
				}
				res.status(201).json({
					success: true,
					message: "Refunds created successfully",
					data: result,
				});
			});
		});
	});
};

const getFavouritesByUserId = (req: Request, res: Response) => {
	const user_id = req.params.userId;
	const bio_id = req.params.bioId;
	const sql =
		"SELECT type,user_id,bio_id FROM favourites WHERE user_id = ? AND bio_id = ? AND type=?";
	db.query<RowDataPacket[]>(sql, [user_id, bio_id, "like"], (err, rows) => {
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
					"All favourites  retrieved successfully",
					rows[0]
				)
			);
	});
};

const getFavouritesCountByBioId = (req: Request, res: Response) => {
	const bio_id = req.params.id;
	console.log(bio_id);
	const sql =
		"SELECT COUNT(*) AS count FROM favourites WHERE bio_id = ? AND type = ?"; // Updated SQL query

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

const addRefundRequest = (req: Request, res: Response) => {
    const { bio_id } = req.body;
    const token_id = req.user?.token_id;
    const payment_id = req.body.payment_id; // Get payment_id from the request body
    const transaction_id = req.body.transaction_id; // Get transaction_id from the request body
    const refund_amount = req.body.refund_amount; // Get refund_amount from the request body
  
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
  
      // Get user_id using token_id
      const getUserIdByTokenSql = `SELECT id FROM user_info WHERE token_id = ?`;
      db.query<RowDataPacket[]>(getUserIdByTokenSql, [token_id], (err, result) => {
        if (err) {
          return rollbackAndRespond(res, db, null, {
            success: false,
            message: "You are not authorized",
            error: err,
          });
        }
  
        const user_id = result[0]?.id;
  
        // Insert the refund request into the refunds table
        const createSql = `INSERT INTO refunds (user_id, payment_id, transaction_id, refund_amount, refund_status) VALUES (?, ?, ?, ?, ?)`;
        db.query(createSql, [user_id, payment_id, transaction_id, refund_amount, "requested"], (err, results) => {
          if (err) {
            console.error("Error inserting refund request:", err);
            return rollbackAndRespond(res, db, err);
          }
  
          db.commit((err) => {
            if (err) {
              console.error("Error committing transaction:", err);
              return rollbackAndRespond(res, db, err);
            }
            res.status(201).json({
              success: true,
              message: "Refund Request Added successfully",
              data: results,
            });
          });
        });
      });
    });
  };
  

  const updateRefund = (req: Request, res: Response) => {
    const data = req.body;
    const token_id = req.user?.token_id as JwtPayload | null;
    let user_id: number | null = null;
  
    if (!token_id) {
      return res.status(401).send({
        statusCode: httpStatus.UNAUTHORIZED,
        message: "You are not authorized",
        success: false,
      });
    }
  
    // Begin a database transaction
    db.beginTransaction((err) => {
      if (err) {
        console.error("Error starting transaction:", err);
        return res.status(500).json({
          success: false,
          message: "Internal Server Error",
          error: err,
        });
      }
  
      // Get user_id using token_id
      const getUserIdByTokenSql = `SELECT id FROM user_info WHERE token_id = ?`;
      db.query<RowDataPacket[]>(getUserIdByTokenSql, [token_id], (err, result) => {
        if (err) {
          return rollbackAndRespond(res, db, null, {
            success: false,
            message: "You are not authorized",
            error: err,
          });
        }
  
        user_id = Number(result[0]?.id);
  
        if (isNaN(user_id)) {
          return rollbackAndRespond(res, db, null, {
            success: false,
            message: "You are not authorized",
            error: err,
          });
        }
  
        // Check if a refund with the provided payment_id exists for the user
        const checkRefundSql = "SELECT * FROM refunds WHERE user_id = ? AND payment_id = ?";
        db.query<RowDataPacket[]>(checkRefundSql, [user_id, data.payment_id], (err, refundResults) => {
          if (err) {
            console.error("Error checking refunds:", err);
            db.rollback(() => {
              res.status(500).json({ success: false, message: err?.message });
            });
            return;
          }
  
          if (refundResults.length === 0) {
            db.rollback(() => {
              res.status(404).json({
                success: false,
                message: "Refund not found for the provided payment_id",
              });
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
              res.status(200).json({ success: true, message: "No changes to update" });
            });
            return;
          }
  
          // Construct the final update SQL statement
          const updateSql = `UPDATE refunds SET ${updateFields.join(", ")} WHERE user_id = ? AND payment_id = ?`;
  
          updateValues.push(user_id);
          updateValues.push(data.payment_id);
  
          // Execute the update query within the transaction
          db.query(updateSql, updateValues, (err, results) => {
            if (err) {
              console.error("Error updating refunds:", err);
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
        });
      });
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

export const FavouritesController = {
	getSingleFavourites,
	addRefundRequest,
	updateRefund,
	deleteFavourites,
	getAllRefunds: getRefundList,
	getFavouritesCountByBioId,
	// getFavouritesListByUserId: getRefundListByUserId,
};
