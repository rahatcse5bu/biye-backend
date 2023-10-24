"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundController = void 0;
const db_1 = __importDefault(require("../../../config/db"));
const http_status_1 = __importDefault(require("http-status"));
const response_1 = require("../../../utils/response");
exports.RefundController = {
    getRefundList: (req, res) => {
        var _a;
        const token_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.token_id;
        // console.log(token_id);
        let user_id = null;
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
                return res.status(500).json({
                    success: false,
                    message: "Internal Server Error",
                    error: err,
                });
            }
            //! Get user_id using token_id
            const getUserIdByTokenSql = `SELECT id FROM user_info WHERE token_id = ?`;
            db_1.default.query(getUserIdByTokenSql, [token_id], (err, result) => {
                var _a;
                if (err) {
                    return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                        success: false,
                        message: "You are not authorized",
                        error: err,
                    });
                }
                user_id = (_a = result[0]) === null || _a === void 0 ? void 0 : _a.id;
                // console.log({ user_id });
                if (!user_id) {
                    return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                        success: false,
                        message: "You are not authorized",
                        error: err,
                    });
                }
                // Handle the GET request to retrieve refunds here
                const getAllRequestRefundSql = "SELECT * FROM refunds WHERE refund_status = 'requested'";
                db_1.default.query(getAllRequestRefundSql, (err, result) => {
                    if (err) {
                        return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                            success: false,
                            message: "Error occurred while checking payment and transaction",
                            error: err,
                        });
                    }
                    db_1.default.commit(() => {
                        res.status(200).json({
                            message: "Retrieve all refunded request successfully",
                            success: true,
                            data: result,
                        });
                    });
                });
            });
        });
    },
    addRefundRequest: (req, res) => {
        var _a;
        const token_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.token_id;
        const data = req.body;
        console.log(token_id);
        let user_id = null;
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
                return res.status(500).json({
                    success: false,
                    message: "Internal Server Error",
                    error: err,
                });
            }
            //! Get user_id using token_id
            const getUserIdByTokenSql = `SELECT id FROM user_info WHERE token_id = ?`;
            db_1.default.query(getUserIdByTokenSql, [token_id], (err, result) => {
                var _a;
                if (err) {
                    return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                        success: false,
                        message: "You are not authorized",
                        error: err,
                    });
                }
                user_id = (_a = result[0]) === null || _a === void 0 ? void 0 : _a.id;
                // console.log({ user_id });
                if (!user_id) {
                    return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                        success: false,
                        message: "You are not authorized",
                        error: err,
                    });
                }
                // Check if payment_id and transaction_id exist
                const checkPaymentAndTransactionSql = `SELECT user_id,payment_id FROM refunds WHERE payment_id = ? AND transaction_id = ?`;
                db_1.default.query(checkPaymentAndTransactionSql, [data.payment_id, data.transaction_id], (err, result) => {
                    if (err) {
                        return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                            success: false,
                            message: "Error occurred while checking payment and transaction",
                            error: err,
                        });
                    }
                    if (result.length > 0) {
                        return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                            success: false,
                            message: "You are already requested for refunding",
                            error: null,
                        });
                    }
                    // If payment_id and transaction_id exist, proceed with adding refund request
                    const sql = "INSERT INTO refunds (user_id, payment_id, transaction_id, refund_amount, refund_status) VALUES (?, ?, ?, ?, ?)";
                    db_1.default.query(sql, [
                        user_id,
                        data.payment_id,
                        data.transaction_id,
                        data.amount,
                        data.refund_status,
                    ], (err, result) => {
                        if (err) {
                            console.error("Error adding refund request:", err);
                            res.status(500).json({
                                success: false,
                                message: "Internal Server Error",
                                error: err,
                            });
                            return;
                        }
                        db_1.default.commit(() => {
                            res.status(200).json({
                                message: "successfully completed",
                                success: true,
                                data: result,
                            });
                        });
                    });
                });
            });
        });
    },
    updateRefundRequest: (req, res) => {
        var _a;
        const token_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.token_id;
        const data = req.body;
        let user_id = null;
        console.log(token_id);
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
                return res.status(500).json({
                    success: false,
                    message: "Internal Server Error",
                    error: err,
                });
            }
            //! Get user_id using token_id
            const getUserIdByTokenSql = `SELECT id FROM user_info WHERE token_id = ?`;
            db_1.default.query(getUserIdByTokenSql, [token_id], (err, result) => {
                var _a;
                if (err) {
                    return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                        success: false,
                        message: "You are not authorized",
                        error: err,
                    });
                }
                user_id = (_a = result[0]) === null || _a === void 0 ? void 0 : _a.id;
                // console.log({ user_id });
                if (!user_id) {
                    return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                        success: false,
                        message: "You are not authorized",
                        error: err,
                    });
                }
                const updateRefundSql = `UPDATE refunds SET  refund_tnx_id = ?, refund_status = ? , refunded_time = CURRENT_TIMESTAMP WHERE payment_id =  ?`;
                db_1.default.query(updateRefundSql, [data.refund_transaction_id, "refunded", data === null || data === void 0 ? void 0 : data.payment_id], (err, result) => {
                    if (err) {
                        return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                            success: false,
                            message: "internal server error",
                            error: err,
                        });
                    }
                    const updatePaymentSql = `UPDATE payments SET refund_status = ? WHERE payment_id = ?`;
                    db_1.default.query(updatePaymentSql, ["refunded", data === null || data === void 0 ? void 0 : data.payment_id], (err, result) => {
                        if (err) {
                            return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                                success: false,
                                message: "internal server error",
                                error: err,
                            });
                        }
                        db_1.default.commit(() => {
                            res.status(200).json({
                                message: "successfully completed",
                                success: true,
                                data: result,
                            });
                        });
                    });
                });
            });
        });
    },
};
exports.default = exports.RefundController;
