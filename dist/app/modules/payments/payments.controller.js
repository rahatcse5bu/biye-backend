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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const db_1 = __importDefault(require("../../../config/db"));
const SendSuccess_1 = require("../../../shared/SendSuccess");
const generatePlaceholders_1 = require("../../../utils/generatePlaceholders");
const payments_constant_1 = require("./payments.constant");
const response_1 = require("../../../utils/response");
const http_status_1 = __importDefault(require("http-status"));
const getPayments = (req, res) => {
    const sql = "SELECT * FROM payments";
    db_1.default.query(sql, (err, rows) => {
        if (err) {
            res.send({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        res
            .status(200)
            .json((0, SendSuccess_1.sendSuccess)("All payments  retrieved successfully", rows));
    });
};
const getSinglePayments = (req, res) => {
    const userId = req.params.id; // Assuming you pass the user ID as a route parameter
    const sql = "SELECT * FROM payments WHERE id = ?";
    db_1.default.query(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        if (rows.length === 0) {
            return res.status(404).json({
                message: "payments not found",
                success: false,
            });
        }
        res
            .status(200)
            .json((0, SendSuccess_1.sendSuccess)("payments retrieved", rows, 200));
    });
};
const createPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const data = req.body;
    const token_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.token_id;
    let others = __rest(data, []);
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
        //? get user_id using token_id
        const getUserIdByTokenSql = `select id from user_info where token_id = ?`;
        db_1.default.query(getUserIdByTokenSql, [token_id], (err, result) => {
            if (err) {
                return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                    success: false,
                    message: "You are not authorized",
                    error: err,
                });
            }
            //console.log(result);
            user_id = result[0].id;
            //! now save payment information to payments table
            others = Object.assign(Object.assign({}, others), { user_id });
            const keys = Object.keys(others);
            const values = Object.values(others);
            //! Insert  into the database
            const insertSql = `INSERT INTO payments (${keys.join(",")}) VALUES (${(0, generatePlaceholders_1.generatePlaceholders)(values.length)})`;
            const payment = [];
            keys.forEach((field) => {
                payment.push(others[field]);
            });
            db_1.default.query(insertSql, payment, (err, results) => {
                if (err) {
                    console.error("Error inserting payments history", err);
                    return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                }
                const paymentStatus = others["status"];
                const amount = +others["amount"];
                let points = 0;
                if (paymentStatus === "Completed") {
                    points = payments_constant_1.amountToPoints[amount] ? +payments_constant_1.amountToPoints[amount] : 0;
                }
                else {
                    points = 0;
                }
                console.log(points);
                const updateGeneralInfoSql = `UPDATE general_info SET points = points + ? where user_id = ?
              `;
                db_1.default.query(updateGeneralInfoSql, [points, user_id], (err, results) => {
                    if (err) {
                        console.error("Error updating user_info:", err);
                        return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                    }
                    //! Commit the transaction if everything is successful
                    db_1.default.commit((err) => {
                        if (err) {
                            console.error("Error committing transaction:", err);
                            return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                        }
                        res.status(201).json({
                            success: true,
                            message: "Payments created and general info updated successfully",
                        });
                    });
                });
            });
        });
    });
});
const updatePayments = (req, res) => {
    const data = req.body;
    const userId = req.params.id; // Assuming you pass the user ID in the URL
    console.log(data);
    // Begin a database transaction
    db_1.default.beginTransaction((err) => {
        if (err) {
            console.error("Error starting transaction:", err);
            return res
                .status(500)
                .json({ success: false, message: "Internal Server Error" });
        }
        // Check if payments for the user with the given ID exists
        const checkUserSql = "SELECT * FROM payments WHERE id = ?";
        db_1.default.query(checkUserSql, [userId], (err, userResults) => {
            if (err) {
                console.error("Error checking payments:", err);
                db_1.default.rollback(() => {
                    res.status(500).json({ success: false, message: err === null || err === void 0 ? void 0 : err.message });
                });
                return;
            }
            const userCount = userResults.length;
            // If payments doesn't exist, send an error response
            if (userCount === 0) {
                db_1.default.rollback(() => {
                    res
                        .status(404)
                        .json({ success: false, message: "payments not found" });
                });
                return;
            }
            const currentUserData = userResults[0];
            // Build the update SQL statement dynamically based on changed values
            const updateFields = [];
            const updateValues = [];
            Object.keys(data).forEach((key) => {
                updateFields.push(`${key} = ?`);
                updateValues.push(data[key]);
            });
            if (updateFields.length === 0) {
                // No fields to update
                db_1.default.commit(() => {
                    res
                        .status(200)
                        .json({ success: true, message: "No changes to update" });
                });
                return;
            }
            // Construct the final update SQL statement
            const updateSql = `UPDATE payments SET ${updateFields.join(", ")} WHERE id = ?`;
            updateValues.push(userId);
            // Execute the update query within the transaction
            db_1.default.query(updateSql, updateValues, (err, results) => {
                if (err) {
                    console.error("Error updating payments:", err);
                    db_1.default.rollback(() => {
                        res
                            .status(500)
                            .json({ success: false, message: "Internal Server Error" });
                    });
                }
                else {
                    // Commit the transaction if the update was successful
                    db_1.default.commit(() => {
                        res
                            .status(200)
                            .json((0, SendSuccess_1.sendSuccess)("Update sucessfully completed", results, 200));
                    });
                }
            });
        });
    });
};
const deletePayments = (req, res) => {
    const userId = req.params.id; // Assuming you pass the user ID in the URL
    // Check if payments for the user with the given ID exists
    const checkUserSql = "SELECT COUNT(*) AS userCount FROM payments WHERE id = ?";
    db_1.default.query(checkUserSql, [userId], (err, userResults) => {
        if (err) {
            console.error("Error checking payments:", err);
            return res.status(500).json({ success: false, message: err === null || err === void 0 ? void 0 : err.message });
        }
        const userCount = userResults[0].userCount;
        // If payments doesn't exist, send an error response
        if (userCount === 0) {
            return res
                .status(404)
                .json({ success: false, message: "payments not found" });
        }
        // If payments exists, proceed with the deletion
        const deleteSql = "DELETE FROM payments WHERE id = ?";
        db_1.default.query(deleteSql, [userId], (err, results) => {
            if (err) {
                console.error("Error deleting payments:", err);
                res
                    .status(500)
                    .json({ success: false, message: "Internal Server Error" });
            }
            else {
                res
                    .status(200)
                    .json({ success: true, message: "payments deleted successfully" });
            }
        });
    });
};
exports.PaymentsController = {
    getPayments,
    getSinglePayments,
    createPayments,
    updatePayments,
    deletePayments,
};
