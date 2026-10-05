"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ApiError_1 = __importDefault(require("./ApiError"));
const zod_1 = require("zod");
const handleZodError_1 = __importDefault(require("../../errors/handleZodError"));
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("../../config"));
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
    else if (err instanceof mongoose_1.default.Error.CastError) {
        // TODO: a malformed id in the URL is a client mistake, not a server crash.
        return res.status(400).json({ message: `Invalid ${err.path}`, success: false });
    }
    else {
        // TODO: log the real error; only development responses include its details.
        console.error("Unhandled error:", err);
        const isDev = config_1.default.node_env === "development";
        return res.status(500).json(Object.assign({ message: isDev ? err === null || err === void 0 ? void 0 : err.message : "Internal Server Error", success: false }, (isDev && { error: err })));
    }
};
exports.default = GlobalErrorHandler;
