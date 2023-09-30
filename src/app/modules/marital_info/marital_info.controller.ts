import { Request, Response } from "express";
import db from "../../../config/db";
import { RowDataPacket } from "mysql2";
import { sendSuccess } from "../../../shared/SendSuccess";
import { MaritalInfoFields } from "./marital_info.constant";
import { generatePlaceholders } from "../../../utils/generatePlaceholders";

const getMaritalInfo = (req: Request, res: Response) => {
  const sql = "SELECT * FROM marital_info";
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
          "All Marital info  retrieved successfully",
          rows
        )
      );
  });
};

const getSingleMaritalInfo = (req: Request, res: Response) => {
  const userId = req.params.id; // Assuming you pass the user ID as a route parameter
  const sql = "SELECT * FROM marital_info WHERE id = ?";

  db.query<RowDataPacket[]>(sql, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: err?.message,
        success: false,
      });
    }

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Marital info not found",
        success: false,
      });
    }

    res
      .status(200)
      .json(sendSuccess<RowDataPacket[]>("Marital info retrieved", rows, 200));
  });
};

const createMaritalInfo = (req: Request, res: Response) => {
  const data = req.body;
  // Insert marital_information into the database
  const insertSql = `INSERT INTO marital_info (
    	${MaritalInfoFields.join(",")}
  ) VALUES (${generatePlaceholders(MaritalInfoFields.length)})`;

  const maritalInfo: string[] = [];
  MaritalInfoFields.forEach((field) => {
    maritalInfo.push(data[field]);
  });

  db.query(insertSql, maritalInfo, (err, results) => {
    if (err) {
      console.error("Error inserting Marital info:", err);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    } else {
      res.status(201).json({
        success: true,
        message: "Marital info created successfully",
      });
    }
  });
};

const updateMaritalInfo = (req: Request, res: Response) => {
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

    // Check if Marital info for the user with the given ID exists
    const checkUserSql = "SELECT * FROM marital_info WHERE id = ?";
    db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
      if (err) {
        console.error("Error checking Marital info:", err);
        db.rollback(() => {
          res.status(500).json({ success: false, message: err?.message });
        });
        return;
      }

      const userCount = userResults.length;

      // If Marital info doesn't exist, send an error response
      if (userCount === 0) {
        db.rollback(() => {
          res
            .status(404)
            .json({ success: false, message: "Marital info not found" });
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
      const updateSql = `UPDATE marital_info SET ${updateFields.join(
        ", "
      )} WHERE id = ?`;

      updateValues.push(userId);

      // Execute the update query within the transaction
      db.query(updateSql, updateValues, (err, results) => {
        if (err) {
          console.error("Error updating Marital info:", err);
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

const deleteMaritalInfo = (req: Request, res: Response) => {
  const userId = req.params.id; // Assuming you pass the user ID in the URL

  // Check if marital_info for the user with the given ID exists
  const checkUserSql =
    "SELECT COUNT(*) AS userCount FROM marital_info WHERE id = ?";
  db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
    if (err) {
      console.error("Error checking Marital info:", err);
      return res.status(500).json({ success: false, message: err?.message });
    }

    const userCount = userResults[0].userCount;

    // If marital_info doesn't exist, send an error response
    if (userCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "marital_info not found" });
    }

    // If Marital info exists, proceed with the deletion
    const deleteSql = "DELETE FROM marital_info WHERE id = ?";
    db.query(deleteSql, [userId], (err, results) => {
      if (err) {
        console.error("Error deleting Marital info:", err);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      } else {
        res.status(200).json({
          success: true,
          message: "Marital info deleted successfully",
        });
      }
    });
  });
};

export const MaritalInfoController = {
  getMaritalInfo,
  getSingleMaritalInfo,
  createMaritalInfo,
  updateMaritalInfo,
  deleteMaritalInfo,
};
