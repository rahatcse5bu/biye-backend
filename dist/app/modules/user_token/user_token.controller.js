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
exports.UserTokenControllers = exports.verifyJWT = void 0;
const db_1 = __importDefault(require("../../../config/db"));
const jwtHelpers_1 = require("../../../helpers/jwtHelpers");
const config_1 = __importDefault(require("../../../config"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const getUserToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenId = req.params.tokenId;
    const sql = `SELECT * FROM user_info WHERE token_id = ?`;
    db_1.default.query(sql, [tokenId], (err, rows) => {
        if (err) {
            return res.status(500).json({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
                error: err,
            });
        }
        if (rows.length === 0) {
            return res.status(404).json({
                message: "User not found",
                success: false,
            });
        }
        const user = rows[0];
        const userPayload = {
            token_id: user.token_id,
            user_role: user.user_role,
        };
        const token = jwtHelpers_1.jwtHelpers.createToken(userPayload, config_1.default.jwt_secret, "2d");
        // const token = "09130";
        const result = {
            success: true,
            message: "token created successfully",
            token: token,
        };
        res.status(200).json(result);
    });
});
//! Middleware function for JWT verification
function verifyJWT(req, res, next) {
    //! Get the JWT token from the request headers, cookies, or wherever you store it
    const token = req.headers.authorization || req.cookies.jwt;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        //! Verify the JWT and assert the type as JwtPayload
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt_secret);
        //! Check if the token is valid and hasn't expired
        if (!decoded ||
            !decoded.exp ||
            decoded.exp < Math.floor(Date.now() / 1000)) {
            return res.status(401).json({ message: "JWT has expired or is invalid" });
        }
        //! Token is valid, proceed to the next middleware or route
        return res.status(200).json({ message: "Token is valid" });
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({ message: "Invalid token" });
        }
        else {
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}
exports.verifyJWT = verifyJWT;
exports.UserTokenControllers = {
    getUserToken,
    verifyJWT,
};
