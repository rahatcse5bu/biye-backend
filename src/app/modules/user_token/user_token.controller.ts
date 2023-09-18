import { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import db from "../../../config/db";
import { sendSuccess } from "../../../shared/SendSuccess";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";
// @ts-ignore
import { Secret } from "jsonwebtoken";

const getUserToken = (req: Request, res: Response) => {
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

export const UserTokenControllers = {
  getUserToken,
};
