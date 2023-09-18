"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserTokenControllers = void 0;
const db_1 = __importDefault(require("../../../config/db"));
const jwtHelpers_1 = require("../../../helpers/jwtHelpers");
const config_1 = __importDefault(require("../../../config"));
const getUserToken = (req, res) => {
    const id = req.params.userId; // Assuming you pass the user ID as a route parameter
    const sql = `SELECT * FROM user_info WHERE id = ?`;
    db_1.default.query(sql, [id], (err, rows) => {
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
            id: user.id,
            user_role: user.user_role,
        };
        const token = jwtHelpers_1.jwtHelpers.createToken(userPayload, config_1.default.jwt_secret, "2d");
        const result = {
            success: true,
            message: "token created successfully",
            token,
        };
        res.status(200).json(result);
    });
};
exports.UserTokenControllers = {
    getUserToken,
};
