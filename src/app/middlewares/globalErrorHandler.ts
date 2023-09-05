import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
const handleGlobalError = (
	err: ErrorRequestHandler,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	err?.statusCode = err?.statusCode || 500;
	err.status = err.status || "error";

	if (process.env.NODE_ENV === "development") {
		// In development, send detailed error information
		res.status(err.statusCode).json({
			status: err.status,
			message: err.message,
			stack: err.stack,
		});
	} else {
		// In production, send a more generic message
		if (err.isOperational) {
			res.status(err.statusCode).json({
				status: err.status,
				message: err.message,
			});
		} else {
			console.error("Error:", err);
			res.status(500).json({
				status: "error",
				message: "Something went wrong!",
			});
		}
	}
};

module.exports = handleGlobalError;
