import { NextFunction, Request, Response } from "express";
import ApiError from "./ApiError";

const GlobalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // console.error("anis",err); // Log the error for debugging purposes

  // Handle different types of errors
  if (err instanceof ApiError) {
    // Handle custom errors with specific status codes and error messages
    return res.status(err.statusCode).json({
      status: err.status,
      statusCode: err.statusCode,
      error: err.message,
    });
  } else if (err instanceof SyntaxError) {
    // Handle JSON parsing errors
    return res.status(400).json({ error: "Invalid JSON" });
  } else {
    // Handle other unexpected errors with a 500 status code
    return res
      .status(500)
      .json({ message: err?.message, success: false, error: err });
  }
};
export default GlobalErrorHandler;
