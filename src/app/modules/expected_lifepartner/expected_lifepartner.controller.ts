import { Request, Response } from "express";
import db from "../../../config/db";
import { RowDataPacket } from "mysql2";
import { sendSuccess } from "../../../shared/SendSuccess";
import { generatePlaceholders } from "../../../utils/generatePlaceholders";
import { ExpectedLifePartnerFields } from "./expected_lifepartner.constant";

const getExpectedLifePartner = (req: Request, res: Response) => {
  const sql = "SELECT * FROM expected_lifepartner";
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
          "All Expected life partner  retrieved successfully",
          rows
        )
      );
  });
};

const getSingleExpectedLifePartner = (req: Request, res: Response) => {
  const userId = req.params.id; // Assuming you pass the user ID as a route parameter
  const sql = "SELECT * FROM expected_lifepartner WHERE id = ?";

  db.query<RowDataPacket[]>(sql, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: err?.message,
        success: false,
      });
    }

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Expected life partner not found",
        success: false,
      });
    }

    res
      .status(200)
      .json(
        sendSuccess<RowDataPacket[]>(
          "Expected life partner retrieved",
          rows,
          200
        )
      );
  });
};

const createExpectedLifePartner = (req: Request, res: Response) => {
  const data = req.body;
  // Insert expected_lifepartnerrmation into the database
  const insertSql = `INSERT INTO expected_lifepartner (
    	${ExpectedLifePartnerFields.join(",")}
  ) VALUES (${generatePlaceholders(ExpectedLifePartnerFields.length)})`;

  const ExpectedLifePartner: string[] = [];
  ExpectedLifePartnerFields.forEach((field) => {
    ExpectedLifePartner.push(data[field]);
  });

  db.query(insertSql, ExpectedLifePartner, (err, results) => {
    if (err) {
      console.error("Error inserting Expected life partner:", err);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    } else {
      res.status(201).json({
        success: true,
        message: "Expected life partner created successfully",
      });
    }
  });
};

const updateExpectedLifePartner = (req: Request, res: Response) => {
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

    // Check if Expected life partner for the user with the given ID exists
    const checkUserSql = "SELECT * FROM expected_lifepartner WHERE id = ?";
    db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
      if (err) {
        console.error("Error checking Expected life partner:", err);
        db.rollback(() => {
          res.status(500).json({ success: false, message: err?.message });
        });
        return;
      }

      const userCount = userResults.length;

      // If Expected life partner doesn't exist, send an error response
      if (userCount === 0) {
        db.rollback(() => {
          res
            .status(404)
            .json({
              success: false,
              message: "Expected life partner not found",
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
      const updateSql = `UPDATE expected_lifepartner SET ${updateFields.join(
        ", "
      )} WHERE id = ?`;

      updateValues.push(userId);

      // Execute the update query within the transaction
      db.query(updateSql, updateValues, (err, results) => {
        if (err) {
          console.error("Error updating Expected life partner:", err);
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

const deleteExpectedLifePartner = (req: Request, res: Response) => {
  const userId = req.params.id; // Assuming you pass the user ID in the URL

  // Check if expected_lifepartner for the user with the given ID exists
  const checkUserSql =
    "SELECT COUNT(*) AS userCount FROM expected_lifepartner WHERE id = ?";
  db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
    if (err) {
      console.error("Error checking Expected life partner:", err);
      return res.status(500).json({ success: false, message: err?.message });
    }

    const userCount = userResults[0].userCount;

    // If expected_lifepartner doesn't exist, send an error response
    if (userCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "expected_lifepartner not found" });
    }

    // If Expected life partner exists, proceed with the deletion
    const deleteSql = "DELETE FROM expected_lifepartner WHERE id = ?";
    db.query(deleteSql, [userId], (err, results) => {
      if (err) {
        console.error("Error deleting Expected life partner:", err);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      } else {
        res.status(200).json({
          success: true,
          message: "Expected life partner deleted successfully",
        });
      }
    });
  });
};

export const ExpectedLifePartnerController = {
  getExpectedLifePartner,
  getSingleExpectedLifePartner,
  createExpectedLifePartner,
  updateExpectedLifePartner,
  deleteExpectedLifePartner,
};
