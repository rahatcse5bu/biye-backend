import { NextFunction, Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import db from "../../../config/db";
import { sendSuccess } from "../../../shared/SendSuccess";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";
// @ts-ignore
import { Secret } from "jsonwebtoken";
import jwt from "jsonwebtoken";

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
export function verifyJWT(req: Request, res: Response, next: NextFunction) {
	//! Get the JWT token from the request headers, cookies, or wherever you store it
	const token = req.headers.authorization || req.cookies.jwt;

	if (!token) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	try {
		//! Verify the JWT and assert the type as JwtPayload
		const decoded = jwt.verify(
			token,
			config.jwt_secret as Secret
		) as jwt.JwtPayload;

		//! Check if the token is valid and hasn't expired
		if (
			!decoded ||
			!decoded.exp ||
			decoded.exp < Math.floor(Date.now() / 1000)
		) {
			return res.status(401).json({ message: "JWT has expired or is invalid" });
		}

		//! Token is valid, proceed to the next middleware or route
		return res.status(200).json({ message: "Token is valid" });
	} catch (error) {
		if (error instanceof jwt.JsonWebTokenError) {
			return res.status(401).json({ message: "Invalid token" });
		} else {
			return res.status(500).json({ message: "Internal server error" });
		}
	}
}

export const UserTokenControllers = {
	getUserToken,
	verifyJWT,
};
