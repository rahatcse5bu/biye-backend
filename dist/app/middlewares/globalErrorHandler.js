"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ApiError_1 = __importDefault(require("./ApiError"));
const GlobalErrorHandler = (err, req, res, next) => {
    // console.error("anis",err); // Log the error for debugging purposes
    // Handle different types of errors
    if (err instanceof ApiError_1.default) {
        // Handle custom errors with specific status codes and error messages
        return res.status(err.statusCode).json({
            status: err.status,
            statusCode: err.statusCode,
            error: err.message,
        });
    }
    else if (err instanceof SyntaxError) {
        // Handle JSON parsing errors
        return res.status(400).json({ error: "Invalid JSON" });
    }
    else {
        // Handle other unexpected errors with a 500 status code
        return res
            .status(500)
            .json({ message: err === null || err === void 0 ? void 0 : err.message, success: false, error: err });
    }
};
exports.default = GlobalErrorHandler;
