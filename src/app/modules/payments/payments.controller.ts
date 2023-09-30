import { Request, Response } from "express";
import db from "../../../config/db";
import { RowDataPacket } from "mysql2";
import { sendSuccess } from "../../../shared/SendSuccess";
import { generatePlaceholders } from "../../../utils/generatePlaceholders";
import { PaymentsFields } from "./payments.constant";

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

const createPayments = (req: Request, res: Response) => {
  const data = req.body;
  // Insert bio_choice_datarmation into the database
  const insertSql = `INSERT INTO bio_choice_data (
    	${PaymentsFields.join(",")}
  ) VALUES (${generatePlaceholders(PaymentsFields.length)})`;

  const BioChoiceData: string[] = [];
  PaymentsFields.forEach((field) => {
    BioChoiceData.push(data[field]);
  });

  db.query(insertSql, BioChoiceData, (err, results) => {
    if (err) {
      console.error("Error inserting payments:", err);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error",error:err });
    } else {
      res.status(201).json({
        success: true,
        message: "payments created successfully",
      });
    }
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
