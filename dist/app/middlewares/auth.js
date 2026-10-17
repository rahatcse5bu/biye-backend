"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const http_status_1 = __importDefault(require("http-status"));
const jwtHelpers_1 = require("../../helpers/jwtHelpers");
const config_1 = __importDefault(require("../../config"));
const mongoose_1 = require("mongoose");
const user_info_model_1 = require("../modules/user_info/user_info.model");
const auth = (...requiredRoles) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Get the authorization token from the header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).send({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "You are not authorized",
                success: false,
            });
        }
        // Extract the token from the header
        const token = authHeader.split(" ")[1];
        // Verify the token
        const verifiedUser = jwtHelpers_1.jwtHelpers.verifyToken(token, config_1.default.jwt_secret);
        // TODO: rejects tokens of deleted users and tokens issued before the last password change.
        const account = (0, mongoose_1.isValidObjectId)(verifiedUser._id)
            ? yield user_info_model_1.UserInfoModel.findById(verifiedUser._id)
                .select("+password_changed_at")
                .lean()
            : null;
        const changedAt = (account === null || account === void 0 ? void 0 : account.password_changed_at)
            ? Math.floor(new Date(account.password_changed_at).getTime() / 1000)
            : 0;
        if (!account || ((_a = verifiedUser.iat) !== null && _a !== void 0 ? _a : 0) < changedAt) {
            return res.status(401).send({
                statusCode: http_status_1.default.UNAUTHORIZED,
                message: "Session expired, please log in again",
                success: false,
            });
        }
        req.user = verifiedUser; // user_role, token_id
        // Check if the user has one of the required roles
        if (requiredRoles.length &&
            !requiredRoles.includes(verifiedUser.user_role)) {
            return res.status(403).send({
                statusCode: http_status_1.default.FORBIDDEN,
                message: "Forbidden",
                success: false,
            });
        }
        next();
    }
    catch (error) {
        // TODO: internal errors (e.g. DB failures) are logged, never echoed to the client.
        const statusCode = error.statusCode || 500;
        if (statusCode === 500)
            console.error("Auth check failed:", error);
        const message = statusCode < 500 ? error.message : "Internal Server Error";
        res.status(statusCode).send({
            statusCode,
            message,
            error: message,
            success: false,
        });
    }
});
exports.auth = auth;
