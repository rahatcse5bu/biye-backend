import { Request, Response } from "express";
import db from "../../../config/db";
import { RowDataPacket } from "mysql2";
import { sendSuccess } from "../../../shared/SendSuccess";
import { generatePlaceholders } from "../../../utils/generatePlaceholders";
import { FamilyStatusFields } from "./family_status.constant";

const getFamilyStatus = (req: Request, res: Response) => {
  const sql = "SELECT * FROM family_status";
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
          "All Family status  retrieved successfully",
          rows
        )
      );
  });
};

const getSingleFamilyStatus = (req: Request, res: Response) => {
  const userId = req.params.id; // Assuming you pass the user ID as a route parameter
  const sql = "SELECT * FROM family_status WHERE id = ?";

  db.query<RowDataPacket[]>(sql, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: err?.message,
        success: false,
      });
    }

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Family status not found",
        success: false,
      });
    }

    res
      .status(200)
      .json(sendSuccess<RowDataPacket[]>("Family status retrieved", rows, 200));
  });
};

const createFamilyStatus = (req: Request, res: Response) => {
  const data = req.body;
  // Insert family_statusrmation into the database
  const insertSql = `INSERT INTO family_status (
    	${FamilyStatusFields.join(",")}
  ) VALUES (${generatePlaceholders(FamilyStatusFields.length)})`;

  const FamilyStatus: string[] = [];
  FamilyStatusFields.forEach((field) => {
    FamilyStatus.push(data[field]);
  });

  db.query(insertSql, FamilyStatus, (err, results) => {
    if (err) {
      console.error("Error inserting Family status:", err);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    } else {
      res.status(201).json({
        success: true,
        message: "Family status created successfully",
      });
    }
  });
};

const updateFamilyStatus = (req: Request, res: Response) => {
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

    // Check if Family status for the user with the given ID exists
    const checkUserSql = "SELECT * FROM family_status WHERE id = ?";
    db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
      if (err) {
        console.error("Error checking Family status:", err);
        db.rollback(() => {
          res.status(500).json({ success: false, message: err?.message });
        });
        return;
      }

      const userCount = userResults.length;

      // If Family status doesn't exist, send an error response
      if (userCount === 0) {
        db.rollback(() => {
          res
            .status(404)
            .json({ success: false, message: "Family status not found" });
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
      const updateSql = `UPDATE family_status SET ${updateFields.join(
        ", "
      )} WHERE id = ?`;

      updateValues.push(userId);

      // Execute the update query within the transaction
      db.query(updateSql, updateValues, (err, results) => {
        if (err) {
          console.error("Error updating Family status:", err);
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

const deleteFamilyStatus = (req: Request, res: Response) => {
  const userId = req.params.id; // Assuming you pass the user ID in the URL

  // Check if family_status for the user with the given ID exists
  const checkUserSql =
    "SELECT COUNT(*) AS userCount FROM family_status WHERE id = ?";
  db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
    if (err) {
      console.error("Error checking Family status:", err);
      return res.status(500).json({ success: false, message: err?.message });
    }

    const userCount = userResults[0].userCount;

    // If family_status doesn't exist, send an error response
    if (userCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "family_status not found" });
    }

    // If Family status exists, proceed with the deletion
    const deleteSql = "DELETE FROM family_status WHERE id = ?";
    db.query(deleteSql, [userId], (err, results) => {
      if (err) {
        console.error("Error deleting Family status:", err);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      } else {
        res.status(200).json({
          success: true,
          message: "Family status deleted successfully",
        });
      }
    });
  });
};

export const FamilyStatusController = {
  getFamilyStatus,
  getSingleFamilyStatus,
  createFamilyStatus,
  updateFamilyStatus,
  deleteFamilyStatus,
};
