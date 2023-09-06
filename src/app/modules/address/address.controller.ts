import { Request, Response } from "express";
import db from "../../../config/db";
import { RowDataPacket } from "mysql2";
import { sendSuccess } from "../../../shared/SendSuccess";
import { AddressFields } from "./address.constant";
import { generatePlaceholders } from "../../../utils/generatePlaceholders";

const getAddress = (req: Request, res: Response) => {
  const sql = "SELECT * FROM address";
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
          "All address  retrieved successfully",
          rows
        )
      );
  });
};

const getSingleAddress = (req: Request, res: Response) => {
  const userId = req.params.id; // Assuming you pass the user ID as a route parameter
  const sql = "SELECT * FROM address WHERE id = ?";

  db.query<RowDataPacket[]>(sql, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: err?.message,
        success: false,
      });
    }

    if (rows.length === 0) {
      return res.status(404).json({
        message: "address not found",
        success: false,
      });
    }

    res
      .status(200)
      .json(sendSuccess<RowDataPacket[]>("address retrieved", rows, 200));
  });
};

const createAddress = (req: Request, res: Response) => {
  const data = req.body;
  // Insert bio_choice_datarmation into the database
  const insertSql = `INSERT INTO bio_choice_data (
    	${AddressFields.join(",")}
  ) VALUES (${generatePlaceholders(AddressFields.length)})`;

  const BioChoiceData: string[] = [];
  AddressFields.forEach((field) => {
    BioChoiceData.push(data[field]);
  });

  db.query(insertSql, BioChoiceData, (err, results) => {
    if (err) {
      console.error("Error inserting Address:", err);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    } else {
      res.status(201).json({
        success: true,
        message: "Address created successfully",
      });
    }
  });
};

const updateAddress = (req: Request, res: Response) => {
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

    // Check if address for the user with the given ID exists
    const checkUserSql = "SELECT * FROM address WHERE id = ?";
    db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
      if (err) {
        console.error("Error checking address:", err);
        db.rollback(() => {
          res.status(500).json({ success: false, message: err?.message });
        });
        return;
      }

      const userCount = userResults.length;

      // If address doesn't exist, send an error response
      if (userCount === 0) {
        db.rollback(() => {
          res
            .status(404)
            .json({ success: false, message: "address not found" });
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
      const updateSql = `UPDATE address SET ${updateFields.join(
        ", "
      )} WHERE id = ?`;

      updateValues.push(userId);

      // Execute the update query within the transaction
      db.query(updateSql, updateValues, (err, results) => {
        if (err) {
          console.error("Error updating address:", err);
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

const deleteAddress = (req: Request, res: Response) => {
  const userId = req.params.id; // Assuming you pass the user ID in the URL

  // Check if address for the user with the given ID exists
  const checkUserSql = "SELECT COUNT(*) AS userCount FROM address WHERE id = ?";
  db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
    if (err) {
      console.error("Error checking address:", err);
      return res.status(500).json({ success: false, message: err?.message });
    }

    const userCount = userResults[0].userCount;

    // If address doesn't exist, send an error response
    if (userCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "address not found" });
    }

    // If address exists, proceed with the deletion
    const deleteSql = "DELETE FROM address WHERE id = ?";
    db.query(deleteSql, [userId], (err, results) => {
      if (err) {
        console.error("Error deleting address:", err);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      } else {
        res
          .status(200)
          .json({ success: true, message: "address deleted successfully" });
      }
    });
  });
};

export const AddressController = {
  getAddress,
  getSingleAddress,
  createAddress,
  updateAddress,
  deleteAddress,
};
