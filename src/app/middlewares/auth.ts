import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import ApiError from "./ApiError";
import { jwtHelpers } from "../../helpers/jwtHelpers";
import config from "../../config";
// @ts-ignore
import { Secret } from "jsonwebtoken";

const auth =
  (...requiredRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      //get authorization token
      const token = req.headers.authorization;
      if (!token) {
        // throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized");
        return res.send({
          statusCode: httpStatus.UNAUTHORIZED,
          message: "You are not authorized",
          success: false,
        });
      }
      // verify token
      let verifiedUser = null;

      verifiedUser = jwtHelpers.verifyToken(
        token as string,
        config.jwt_secret as Secret
      );

      req.user = verifiedUser; // role  , userid

      // role diye guard korar jnno
      if (
        requiredRoles.length &&
        !requiredRoles.includes(verifiedUser.user_role)
      ) {
        // throw new ApiError(httpStatus.FORBIDDEN, "Forbidden");
        res.send({
          statusCode: httpStatus.FORBIDDEN,
          message: "Forbidden",
          success: false,
        });
      }
      next();
    } catch (error) {
      res.send({
        statusCode: 500,
        error: error,
        success: false,
      });
    }
  };
