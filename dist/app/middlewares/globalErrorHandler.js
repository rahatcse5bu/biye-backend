"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ApiError_1 = __importDefault(require("./ApiError"));
const zod_1 = require("zod");
const handleZodError_1 = __importDefault(require("../../errors/handleZodError"));
const GlobalErrorHandler = (err, req, res, next) => {
    if (err instanceof zod_1.ZodError) {
        const simplifiedError = (0, handleZodError_1.default)(err);
        const statusCode = simplifiedError.statusCode;
        const message = simplifiedError.message;
        return res.status(statusCode).json({
            statusCode: statusCode,
            message: message,
            success: false,
            error: simplifiedError.errorMessages,
        });
    }
    else if (err instanceof ApiError_1.default) {
        // Handle custom errors with specific status codes and error messages
        return res.status(err.statusCode).json({
            status: err.status,
            statusCode: err.statusCode,
            error: err.message,
            success: false,
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
