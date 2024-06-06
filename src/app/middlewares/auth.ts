import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { jwtHelpers } from "../../helpers/jwtHelpers";
import config from "../../config";
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
      res.status(500).send({
        statusCode: 500,
        message: "Internal Server Error",
        error: error.message,
        success: false,
      });
    }
  };
