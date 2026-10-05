import { NextFunction, Request, Response } from "express";
import ApiError from "./ApiError";
import { ZodError } from "zod";
import handleZodError from "../../errors/handleZodError";
import mongoose from "mongoose";
import config from "../../config";

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
  } else if (err instanceof mongoose.Error.CastError) {
    // TODO: a malformed id in the URL is a client mistake, not a server crash.
    return res.status(400).json({ message: `Invalid ${err.path}`, success: false });
  } else {
    // TODO: log the real error; only development responses include its details.
    console.error("Unhandled error:", err);
    const isDev = config.node_env === "development";
    return res.status(500).json({
      message: isDev ? err?.message : "Internal Server Error",
      success: false,
      ...(isDev && { error: err }),
    });
  }
};
export default GlobalErrorHandler;
