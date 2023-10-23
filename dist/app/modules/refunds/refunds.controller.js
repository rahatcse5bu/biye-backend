"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundController = void 0;
const db_1 = __importDefault(require("../../../config/db"));
exports.RefundController = {
    getRefundList: (req, res) => {
        // Handle the GET request to retrieve refunds here
        const sql = "SELECT * FROM refunds WHERE refund_status = 'requested'";
        db_1.default.query(sql, (err, result) => {
            if (err) {
                console.error("Error retrieving refunds:", err);
                res.status(500).json({
                    success: false,
                    message: "Internal Server Error",
                    error: err,
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: result,
            });
        });
    },
    addRefundRequest: (req, res) => {
        // Handle the POST request to add a refund request here
        const data = req.body;
        const sql = "INSERT INTO refunds (user_id, payment_id, transaction_id, refund_amount, refund_status) VALUES (?, ?, ?, ?, ?)";
        db_1.default.query(sql, [data.user_id, data.payment_id, data.transaction_id, data.refund_amount, data.refund_status], (err, result) => {
            if (err) {
                console.error("Error adding refund request:", err);
                res.status(500).json({
                    success: false,
                    message: "Internal Server Error",
                    error: err,
                });
                return;
            }
            res.status(201).json({
                success: true,
                message: "Refund Request Added successfully",
                data: result,
            });
        });
    },
};
exports.default = exports.RefundController;
