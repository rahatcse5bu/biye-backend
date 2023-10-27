import { NextFunction, Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import db from "../../../config/db";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";
// @ts-ignore
import { Secret } from "jsonwebtoken";
import { rollbackAndRespond } from "../../../utils/response";
import httpStatus from "http-status";

const getUserToken = async (req: Request, res: Response) => {
	const tokenId = req.params.tokenId;
	const sql = `SELECT * FROM user_info WHERE token_id = ?`;

	db.query<RowDataPacket[]>(sql, [tokenId], (err, rows) => {
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

		const user = rows[0];
		const userPayload = {
			token_id: user.token_id,
			user_role: user.user_role,
		};
		const token = jwtHelpers.createToken(
			userPayload,
			config.jwt_secret as Secret,
			"2d"
		);
		// const token = "09130";

		const result = {
			success: true,
			message: "token created successfully",
			token: token,
		};

		res.status(200).json(result);
	});
};

//! Middleware function for JWT verification
const verifyJWT = async (req: Request, res: Response) => {
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

				user_id = result[0]?.id;

				if (!user_id) {
					return rollbackAndRespond(res, db, null, {
						success: false,
						message: "You are not authorized",
						error: err,
					});
				}

				db.commit((err) => {
					if (err) {
						console.error("Error committing transaction:", err);
						return rollbackAndRespond(res, db, err);
					}

					res.status(201).json({
						success: true,
						message: "User info data get successfully",
						data: {
							user_id: user_id,
						},
					});
				});
			}
		);
	});
};

export const UserTokenControllers = {
	getUserToken,
	verifyJWT,
};
