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
exports.UserTokenControllers = void 0;
const db_1 = __importDefault(require("../../../config/db"));
const jwtHelpers_1 = require("../../../helpers/jwtHelpers");
const config_1 = __importDefault(require("../../../config"));
const response_1 = require("../../../utils/response");
const http_status_1 = __importDefault(require("http-status"));
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
const verifyJWT = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.token_id;
    let user_id = null;
    // console.log(req.user);
    if (!token_id) {
        return res.status(401).send({
            statusCode: http_status_1.default.UNAUTHORIZED,
            message: "You are not authorized",
            success: false,
        });
    }
    db_1.default.beginTransaction((err) => {
        if (err) {
            console.error("Error starting transaction:", err);
            return res
                .status(500)
                .json({ success: false, message: "Internal Server Error", error: err });
        }
        //! get user_id using token_id
        const getUserIdByTokenSql = `select id from user_info where token_id = ?`;
        db_1.default.query(getUserIdByTokenSql, [token_id], (err, result) => {
            var _a;
            if (err) {
                return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                    success: false,
                    message: "You are not authorized",
                    error: err,
                });
            }
            //console.log(result);
            user_id = (_a = result[0]) === null || _a === void 0 ? void 0 : _a.id;
            if (!user_id) {
                return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                    success: false,
                    message: "You are not authorized",
                    error: err,
                });
            }
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error committing transaction:", err);
                    return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                }
                res.status(201).json({
                    success: true,
                    message: "User info data get successfully",
                    data: {
                        user_id: user_id,
                    },
                });
            });
        });
    });
});
exports.UserTokenControllers = {
    getUserToken,
    verifyJWT,
};
