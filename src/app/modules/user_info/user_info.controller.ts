import { Request, Response } from "express";
import db from "../../../config/db";
import { RowDataPacket } from "mysql2";

const getUserInfo = (req: Request, res: Response) => {
	const sql = `select * from user_info`;
	db.query(sql, (err, rows) => {
		if (err) {
			res.send({
				message: err?.message,
				success: false,
			});
		}

		res.send(rows);
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
				return res.send(err);
			}

			const emailCount = emailResults[0].emailCount;

			console.log(emailResults);

			// If the email already exists, send an error response
			if (emailCount > 0) {
				return res.status(400).json({ error: "Email already exists" });
			}

			// If the email doesn't exist, proceed with the insertion
			const insertSql =
				"INSERT INTO user_info (username, password, email, phone) VALUES (?, ?, ?, ?)";
			db.query(
				insertSql,
				[data.username, data.password, data.email, data.phone],
				(err, results) => {
					if (err) {
						console.error("Error inserting data:", err);
						res.send(err);
					} else {
						res.send(results);
					}
				}
			);
		}
	);
};

export const UserInfoController = {
	getUserInfo,
	createUserInfo,
};
