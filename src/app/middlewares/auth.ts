import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { jwtHelpers } from "../../helpers/jwtHelpers";
import config from "../../config";
import { isValidObjectId } from "mongoose";
import { UserInfoModel } from "../modules/user_info/user_info.model";
// @ts-ignore
import { Secret } from "jsonwebtoken";

export const auth =
  (...requiredRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get the authorization token from the header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).send({
          statusCode: httpStatus.UNAUTHORIZED,
          message: "You are not authorized",
          success: false,
        });
      }

      // Extract the token from the header
      const token = authHeader.split(" ")[1];

      // Verify the token
      const verifiedUser = jwtHelpers.verifyToken(
        token,
        config.jwt_secret as Secret
      );

      // TODO: rejects tokens of deleted users and tokens issued before the last password change.
      const account = isValidObjectId(verifiedUser._id)
        ? await UserInfoModel.findById(verifiedUser._id)
            .select("+password_changed_at")
            .lean()
        : null;
      const changedAt = account?.password_changed_at
        ? Math.floor(new Date(account.password_changed_at).getTime() / 1000)
        : 0;
      if (!account || (verifiedUser.iat ?? 0) < changedAt) {
        return res.status(401).send({
          statusCode: httpStatus.UNAUTHORIZED,
          message: "Session expired, please log in again",
          success: false,
        });
      }

      req.user = verifiedUser; // user_role, token_id

      // Check if the user has one of the required roles
      if (
        requiredRoles.length &&
        !requiredRoles.includes(verifiedUser.user_role)
      ) {
        return res.status(403).send({
          statusCode: httpStatus.FORBIDDEN,
          message: "Forbidden",
          success: false,
        });
      }

      next();
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      const message = error.isOperational ? error.message : "Internal Server Error";
      res.status(statusCode).send({
        statusCode,
        message,
        error: error.message,
        success: false,
      });
    }
  };
