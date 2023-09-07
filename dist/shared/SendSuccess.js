"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = void 0;
const sendSuccess = (message, data, statusCode = 200) => {
    return {
        success: true,
        statusCode: statusCode,
        message,
        data,
    };
};
exports.sendSuccess = sendSuccess;
