// @ts-ignore
import jwt, {
  JsonWebTokenError,
  JwtPayload,
  Secret,
  TokenExpiredError,
} from "jsonwebtoken";
import ApiError from "../app/middlewares/ApiError";
type JwtPayloadOrNull = JwtPayload;
// type JwtPayloadOrNull = JwtPayload | null;

const createToken = (
  payload: Record<string, unknown>,
  secret: Secret,
  expireTime: string = "30d"
): string => {
  // return jwt.sign(payload, secret, {
  //   expiresIn: expireTime,
  // });

  try {
    return jwt.sign(payload, secret, {
      expiresIn: expireTime, // Set to one month
    });
  } catch (error: any) {
    throw new Error(`Error creating token: ${error.message}`);
  }
};

const verifyToken = (token: string, secret: Secret): JwtPayloadOrNull => {
  // return jwt.verify(token, secret) ;

  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error: any) {
    if (error instanceof TokenExpiredError) {
      console.log("Token has expired");
      throw new ApiError(401, "Token has expired");
    } else if (error instanceof JsonWebTokenError) {
      console.log("Token is invalid");
      throw new ApiError(401, "Token is invalid");
    } else {
      console.log("Token verification failed:", error.message);
      throw new ApiError(400, "Token verification failed");
    }
  }
};

export const jwtHelpers = {
  createToken,
  verifyToken,
};
