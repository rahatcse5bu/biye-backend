import { NextFunction, Request, Response } from "express";
import ApiError from "./ApiError";
import { ZodError } from "zod";
import handleZodError from "../../errors/handleZodError";

const GlobalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    const statusCode = simplifiedError.statusCode;
    const message = simplifiedError.message;
    return res.status(statusCode).json({
      statusCode: statusCode,
      message: message,
      success: false,
      error: simplifiedError.errorMessages,
    });
  } else if (err instanceof ApiError) {
    // Handle custom errors with specific status codes and error messages
    return res.status(err.statusCode).json({
      status: err.status,
      statusCode: err.statusCode,
      error: err.message,
      success: false,
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
