import { Request, Response } from "express";
import db from "../../../config/db";
import { RowDataPacket } from "mysql2";
import { sendSuccess } from "../../../shared/SendSuccess";
import { generatePlaceholders } from "../../../utils/generatePlaceholders";
import { EducationalQualificationFields } from "./educational_qualification.constant";

const getEducationalQualification = (req: Request, res: Response) => {
  const sql = "SELECT * FROM educational_qualification";
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
          "All Educational qualification  retrieved successfully",
          rows
        )
      );
  });
};

const getSingleEducationalQualification = (req: Request, res: Response) => {
  const userId = req.params.id; // Assuming you pass the user ID as a route parameter
  const sql = "SELECT * FROM educational_qualification WHERE id = ?";

  db.query<RowDataPacket[]>(sql, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: err?.message,
        success: false,
      });
    }

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Educational qualification not found",
        success: false,
      });
    }

    res
      .status(200)
      .json(
        sendSuccess<RowDataPacket[]>(
          "Educational qualification retrieved",
          rows,
          200
        )
      );
  });
};

const createEducationalQualification = (req: Request, res: Response) => {
  const data = req.body;

  // Check if user_id already exists in the educational_qualification table
  const checkSql = `SELECT user_id FROM educational_qualification WHERE user_id = ?`;

  db.query<RowDataPacket[]>(checkSql, [data.user_id], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Error checking user_id:", checkErr);
      res.status(500).json({ success: false, message: "Internal Server Error",error:checkErr });
    } else if (checkResults.length > 0) {
      // If user_id exists, return an error response
      res.status(400).json({ success: false, message: "User ID already exists" });
    } else {
      // Insert educational_qualification information into the database
      const insertSql = `INSERT INTO educational_qualification (${EducationalQualificationFields.join(",")}) VALUES (${generatePlaceholders(EducationalQualificationFields.length)})`;

      const educationalQualificationData:string[] = [];
      EducationalQualificationFields.forEach((field) => {
        educationalQualificationData.push(data[field]);
      });

      db.query(insertSql, educationalQualificationData, (insertErr, results) => {
        if (insertErr) {
          console.error("Error inserting Educational qualification:", insertErr);
          res.status(500).json({ success: false, message: "Internal Server Error" });
        } else {
          res.status(201).json({
            success: true,
            message: "Educational qualification created successfully",
          });
        }
      });
    }
  });
};


const updateEducationalQualification = (req: Request, res: Response) => {
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

    // Check if Educational qualification for the user with the given ID exists
    const checkUserSql = "SELECT * FROM educational_qualification WHERE id = ?";
    db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
      if (err) {
        console.error("Error checking Educational qualification:", err);
        db.rollback(() => {
          res.status(500).json({ success: false, message: err?.message });
        });
        return;
      }

      const userCount = userResults.length;

      // If Educational qualification doesn't exist, send an error response
      if (userCount === 0) {
        db.rollback(() => {
          res.status(404).json({
            success: false,
            message: "Educational qualification not found",
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
      const updateSql = `UPDATE educational_qualification SET ${updateFields.join(
        ", "
      )} WHERE id = ?`;

      updateValues.push(userId);

      // Execute the update query within the transaction
      db.query(updateSql, updateValues, (err, results) => {
        if (err) {
          console.error("Error updating Educational qualification:", err);
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

const deleteEducationalQualification = (req: Request, res: Response) => {
  const userId = req.params.id; // Assuming you pass the user ID in the URL

  // Check if educational_qualification for the user with the given ID exists
  const checkUserSql =
    "SELECT COUNT(*) AS userCount FROM educational_qualification WHERE id = ?";
  db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
    if (err) {
      console.error("Error checking Educational qualification:", err);
      return res.status(500).json({ success: false, message: err?.message });
    }

    const userCount = userResults[0].userCount;

    // If educational_qualification doesn't exist, send an error response
    if (userCount === 0) {
      return res.status(404).json({
        success: false,
        message: "educational_qualification not found",
      });
    }

    // If Educational qualification exists, proceed with the deletion
    const deleteSql = "DELETE FROM educational_qualification WHERE id = ?";
    db.query(deleteSql, [userId], (err, results) => {
      if (err) {
        console.error("Error deleting Educational qualification:", err);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      } else {
        res.status(200).json({
          success: true,
          message: "Educational qualification deleted successfully",
        });
      }
    });
  });
};

export const EducationalQualificationController = {
  getEducationalQualification,
  getSingleEducationalQualification,
  createEducationalQualification,
  updateEducationalQualification,
  deleteEducationalQualification,
};
