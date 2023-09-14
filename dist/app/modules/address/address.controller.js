"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressController = void 0;
const db_1 = __importDefault(require("../../../config/db"));
const SendSuccess_1 = require("../../../shared/SendSuccess");
const address_constant_1 = require("./address.constant");
const generatePlaceholders_1 = require("../../../utils/generatePlaceholders");
const getAddress = (req, res) => {
    const sql = "SELECT * FROM address";
    db_1.default.query(sql, (err, rows) => {
        if (err) {
            res.send({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        res
            .status(200)
            .json((0, SendSuccess_1.sendSuccess)("All address  retrieved successfully", rows));
    });
};
const getSingleAddress = (req, res) => {
    const userId = req.params.id; // Assuming you pass the user ID as a route parameter
    const sql = "SELECT * FROM address WHERE id = ?";
    db_1.default.query(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        if (rows.length === 0) {
            return res.status(404).json({
                message: "address not found",
                success: false,
            });
        }
        res
            .status(200)
            .json((0, SendSuccess_1.sendSuccess)("address retrieved", rows, 200));
    });
};
const createAddress = (req, res) => {
    const data = req.body;
    const userId = data.user_id; // Assuming user_id is the field you want to check
    // Check if the user_id already exists in the address table
    const userExistsQuery = "SELECT COUNT(*) AS userCount FROM address WHERE user_id = ?";
    db_1.default.query(userExistsQuery, [userId], (userErr, userResults) => {
        if (userErr) {
            console.error("Error checking user existence in address table:", userErr);
            return res
                .status(500)
                .json({ success: false, message: "Internal Server Error", error: userErr });
        }
        const userCount = userResults[0].userCount;
        // If userCount is greater than 0, the user_id already exists in the address table
        if (userCount > 0) {
            return res.status(400).json({
                success: false,
                message: "User already has an address",
            });
        }
        // If userCount is 0, the user_id doesn't exist, so you can proceed with the insertion
        const insertSql = `INSERT INTO address (${address_constant_1.AddressFields.join(",")}) VALUES (${(0, generatePlaceholders_1.generatePlaceholders)(address_constant_1.AddressFields.length)})`;
        const addressData = [];
        address_constant_1.AddressFields.forEach((field) => {
            addressData.push(data[field]);
        });
        db_1.default.query(insertSql, addressData, (err, results) => {
            if (err) {
                console.error("Error inserting Address:", err);
                res.status(500).json({
                    success: false,
                    message: "Internal Server Error",
                    error: err,
                });
            }
            else {
                res.status(201).json({
                    success: true,
                    message: "Address created successfully",
                });
            }
        });
    });
};
const updateAddress = (req, res) => {
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
        // Check if address for the user with the given ID exists
        const checkUserSql = "SELECT * FROM address WHERE id = ?";
        db_1.default.query(checkUserSql, [userId], (err, userResults) => {
            if (err) {
                console.error("Error checking address:", err);
                db_1.default.rollback(() => {
                    res.status(500).json({ success: false, message: err === null || err === void 0 ? void 0 : err.message });
                });
                return;
            }
            const userCount = userResults.length;
            // If address doesn't exist, send an error response
            if (userCount === 0) {
                db_1.default.rollback(() => {
                    res
                        .status(404)
                        .json({ success: false, message: "address not found" });
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
            const updateSql = `UPDATE address SET ${updateFields.join(", ")} WHERE id = ?`;
            updateValues.push(userId);
            // Execute the update query within the transaction
            db_1.default.query(updateSql, updateValues, (err, results) => {
                if (err) {
                    console.error("Error updating address:", err);
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
const deleteAddress = (req, res) => {
    const userId = req.params.id; // Assuming you pass the user ID in the URL
    // Check if address for the user with the given ID exists
    const checkUserSql = "SELECT COUNT(*) AS userCount FROM address WHERE id = ?";
    db_1.default.query(checkUserSql, [userId], (err, userResults) => {
        if (err) {
            console.error("Error checking address:", err);
            return res.status(500).json({ success: false, message: err === null || err === void 0 ? void 0 : err.message });
        }
        const userCount = userResults[0].userCount;
        // If address doesn't exist, send an error response
        if (userCount === 0) {
            return res
                .status(404)
                .json({ success: false, message: "address not found" });
        }
        // If address exists, proceed with the deletion
        const deleteSql = "DELETE FROM address WHERE id = ?";
        db_1.default.query(deleteSql, [userId], (err, results) => {
            if (err) {
                console.error("Error deleting address:", err);
                res
                    .status(500)
                    .json({ success: false, message: "Internal Server Error" });
            }
            else {
                res
                    .status(200)
                    .json({ success: true, message: "address deleted successfully" });
            }
        });
    });
};
exports.AddressController = {
    getAddress,
    getSingleAddress,
    createAddress,
    updateAddress,
    deleteAddress,
};
