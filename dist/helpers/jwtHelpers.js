"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtHelpers = void 0;
// @ts-ignore
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const ApiError_1 = __importDefault(require("../app/middlewares/ApiError"));
// type JwtPayloadOrNull = JwtPayload | null;
const createToken = (payload, secret, expireTime = "30d") => {
    // return jwt.sign(payload, secret, {
    //   expiresIn: expireTime,
    // });
    try {
        return jsonwebtoken_1.default.sign(payload, secret, {
            expiresIn: expireTime, // Set to one month
        });
    }
    catch (error) {
        throw new Error(`Error creating token: ${error.message}`);
    }
};
const verifyToken = (token, secret) => {
    // return jwt.verify(token, secret) ;
    try {
        return jsonwebtoken_1.default.verify(token, secret);
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.TokenExpiredError) {
            console.log("Token has expired");
            throw new ApiError_1.default(401, "Token has expired");
        }
        else if (error instanceof jsonwebtoken_1.JsonWebTokenError) {
            console.log("Token is invalid");
            throw new ApiError_1.default(401, "Token is invalid");
        }
        else {
            console.log("Token verification failed:", error.message);
            throw new ApiError_1.default(400, "Token verification failed");
        }
    }
};
exports.jwtHelpers = {
    createToken,
    verifyToken,
};
