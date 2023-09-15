import { Request, Response } from "express";
import db from "../../../config/db";
import { RowDataPacket } from "mysql2";
import { sendSuccess } from "../../../shared/SendSuccess";
import { UserInfoFields } from "./user_info.constant";
import { generatePlaceholders } from "../../../utils/generatePlaceholders";

const getUserInfo = (req: Request, res: Response) => {
  const sql = `select * from user_info`;
  db.query<RowDataPacket[]>(sql, (err, rows) => {
    if (err) {
      res.send({
        message: err?.message,
        success: false,
      });
    }
    res
      .status(201)
      .json(
        sendSuccess<RowDataPacket[]>(
          "All user info retrieved successfully",
          rows
        )
      );
  });
};

const getUserInfoByEmail = (req: Request, res: Response) => {
  const email = req.params.email; // Assuming you pass the user ID as a route parameter
  const sql = `SELECT * FROM user_info WHERE email = ?`;

  db.query<RowDataPacket[]>(sql, [email], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: err?.message,
        success: false,
        error: err,
      });
    }

    if (rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    res
      .status(200)
      .json(sendSuccess<RowDataPacket[]>("single user retrieved", rows, 200));
  });
};

const createUserForGoogleSignIn = (req: Request, res: Response) => {
  const data = req.body;
  const checkEmailSql =
    "SELECT COUNT(*) AS emailCount FROM user_info WHERE email = ?";

  // First, check if the email already exists
  db.query<RowDataPacket[]>(
    checkEmailSql,
    [data.email],
    (err, emailResults) => {
      if (err) {
        console.error("Error checking email:", err);
        return res.send({
          success: false,
          message: "Something went wrong.",
          error: err,
        });
      }

      const emailCount = emailResults[0].emailCount;

      // console.log(emailResults);

      // If the email already exists, send an error response
      if (emailCount > 0) {
        // Generate the SQL update statement dynamically based on the provided fields
        const updateFields: string[] = [];
        const updateValues: string[] = [];

        Object.keys(data).forEach((key) => {
          updateFields.push(`${key} = ?`);
          updateValues.push(data[key]);
        });

        if (updateFields.length === 0) {
          // No fields to update
          return res
            .status(400)
            .json({ success: true, message: "No update data provided" });
        }

        const updateSql = `UPDATE user_info SET ${updateFields.join(
          ", "
        )} WHERE email = ?`;
        const updateParams = [...updateValues, data?.email];

        db.query(updateSql, updateParams, (err, results) => {
          if (err) {
            console.error("Error updating data:", err);
            res.status(500).json({ success: false, message: "Server error" });
          } else {
            res.json({
              success: true,
              message: "User information updated successfully",
            });
          }
        });
      } else {
        // If the email doesn't exist, proceed with the insertion
        const insertSql = `INSERT INTO user_info (
					${UserInfoFields.join(",")}
				) VALUES (${generatePlaceholders(UserInfoFields.length)})`;

        const UserInfoData: string[] = [];
        UserInfoFields.forEach((field) => {
          UserInfoData.push(data[field]);
        });
        db.query(insertSql, UserInfoData, (err, results) => {
          if (err) {
            console.error("Error inserting data:", err);
            res.send({
              success: false,
              message: "Something went wrong",
              error: err,
            });
          } else {
            res.send({
              success: true,
              message: "User info created successfully",
            });
          }
        });
      }
    }
  );
};

const getSingleUserInfo = (req: Request, res: Response) => {
  const userId = req.params.id; // Assuming you pass the user ID as a route parameter
  const sql = `SELECT * FROM user_info WHERE id = ?`;

  db.query<RowDataPacket[]>(sql, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: err?.message,
        success: false,
      });
    }

    if (rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    res
      .status(200)
      .json(sendSuccess<RowDataPacket[]>("single user retrieved", rows, 200));
  });
};

const createUserInfo = (req: Request, res: Response) => {
  const data = req.body;
  const checkEmailSql =
    "SELECT COUNT(*) AS emailCount FROM user_info WHERE email = ?";

  // First, check if the email already exists
  db.query<RowDataPacket[]>(
    checkEmailSql,
    [data.email],
    (err, emailResults) => {
      if (err) {
        console.error("Error checking email:", err);
        return res.send({
          success: false,
          message: "Something went wrong.",
          error: err,
        });
      }

      const emailCount = emailResults[0].emailCount;

      console.log(emailResults);

      // If the email already exists, send an error response
      if (emailCount > 0) {
        return res
          .status(400)
          .json({ success: false, message: "Email already exists" });
      }

      // If the email doesn't exist, proceed with the insertion

      const insertSql = `INSERT INTO user_info (
				${UserInfoFields.join(",")}
		  ) VALUES (${generatePlaceholders(UserInfoFields.length)})`;

      const UserInfoData: string[] = [];
      UserInfoFields.forEach((field) => {
        UserInfoData.push(data[field]);
      });

      db.query(insertSql, UserInfoData, (err, results) => {
        if (err) {
          console.error("Error inserting data:", err);
          res.send({
            success: false,
            message: "Something went wrong",
            error: err,
          });
        } else {
          res.send({
            success: true,
            message: "User info created successfully",
          });
        }
      });
    }
  );
};

const updateUserInfo = (req: Request, res: Response) => {
  const data = req.body;
  const userId = req.params.id; // Assuming you pass the user ID in the URL

  // Check if the user with the given ID exists
  const checkUserSql =
    "SELECT COUNT(*) AS userCount FROM user_info WHERE id = ?";
  db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
    if (err) {
      console.error("Error checking user:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    const userCount = userResults[0].userCount;

    // If the user doesn't exist, send an error response
    if (userCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Generate the SQL update statement dynamically based on the provided fields
    const updateFields = [];
    const updateValues = [];

    if (data.username) {
      updateFields.push("username = ?");
      updateValues.push(data.username);
    }

    if (data.password) {
      updateFields.push("password = ?");
      updateValues.push(data.password);
    }

    if (data.email) {
      updateFields.push("email = ?");
      updateValues.push(data.email);
    }

    if (data.phone) {
      updateFields.push("phone = ?");
      updateValues.push(data.phone);
    }

    if (updateFields.length === 0) {
      // No fields to update
      return res
        .status(400)
        .json({ success: false, message: "No update data provided" });
    }

    const updateSql = `UPDATE user_info SET ${updateFields.join(
      ", "
    )} WHERE id = ?`;
    const updateParams = [...updateValues, userId];

    db.query(updateSql, updateParams, (err, results) => {
      if (err) {
        console.error("Error updating data:", err);
        res.status(500).json({ success: false, message: "Server error" });
      } else {
        res.json({
          success: true,
          message: "User information updated successfully",
        });
      }
    });
  });
};

const deleteUserInfo = (req: Request, res: Response) => {
  const userId = req.params.id; // Assuming you pass the user ID in the URL

  // Check if the user with the given ID exists
  const checkUserSql =
    "SELECT COUNT(*) AS userCount FROM user_info WHERE id = ?";
  db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
    if (err) {
      console.error("Error checking user:", err);
      return res.send(err);
    }

    const userCount = userResults[0].userCount;

    // If the user doesn't exist, send an error response
    if (userCount === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // If the user exists, proceed with the deletion
    const deleteSql = "DELETE FROM user_info WHERE id = ?";
    db.query(deleteSql, [userId], (err, results) => {
      if (err) {
        console.error("Error deleting user:", err);
        res.send(err);
      } else {
        res.send(results);
      }
    });
  });
};

export const UserInfoController = {
  getUserInfo,
  createUserInfo,
  updateUserInfo,
  deleteUserInfo,
  getSingleUserInfo,
  createUserForGoogleSignIn,
  getUserInfoByEmail,
};
