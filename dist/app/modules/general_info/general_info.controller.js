"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneralInfoController = void 0;
const db_1 = __importDefault(require("../../../config/db"));
const SendSuccess_1 = require("../../../shared/SendSuccess");
const generatePlaceholders_1 = require("../../../utils/generatePlaceholders");
const general_info_constant_1 = require("./general_info.constant");
const getGeneralInfo = (req, res) => {
    const sql = "SELECT * FROM general_info";
    db_1.default.query(sql, (err, rows) => {
        if (err) {
            res.send({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        res
            .status(200)
            .json((0, SendSuccess_1.sendSuccess)("All General info  retrieved successfully", rows));
    });
};
const getSingleGeneralInfo = (req, res) => {
    const userId = req.params.id; // Assuming you pass the user ID as a route parameter
    const sql = "SELECT * FROM general_info WHERE id = ?";
    db_1.default.query(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        if (rows.length === 0) {
            return res.status(404).json({
                message: "General info not found",
                success: false,
            });
        }
        res
            .status(200)
            .json((0, SendSuccess_1.sendSuccess)("General info retrieved", rows, 200));
    });
};
const createGeneralInfo = (req, res) => {
    const data = req.body;
    // Insert general_information into the database
    const insertSql = `INSERT INTO general_info (
    	${general_info_constant_1.GeneralInfoFields.join(",")}
  ) VALUES (${(0, generatePlaceholders_1.generatePlaceholders)(general_info_constant_1.GeneralInfoFields.length)})`;
    const GeneralInfo = [];
    general_info_constant_1.GeneralInfoFields.forEach((field) => {
        if (field === 'date_of_birth') {
            GeneralInfo.push(`STR_TO_DATE(${data[field]}, '%Y-%m-%dT%H:%i:%s.%fZ'`);
        }
        else {
            GeneralInfo.push(data[field]);
        }
    });
    db_1.default.query(insertSql, GeneralInfo, (err, results) => {
        if (err) {
            console.error("Error inserting General info:", err);
            res
                .status(500)
                .json({ success: false, message: "Internal Server Error", error: err });
        }
        else {
            res.status(201).json({
                success: true,
                message: "General info created successfully",
            });
        }
    });
};
const updateGeneralInfo = (req, res) => {
    const data = req.body;
    const userId = req.params.id; // Assuming you pass the user ID in the URL
    //   console.log(data);
    // Begin a database transaction
    db_1.default.beginTransaction((err) => {
        if (err) {
            console.error("Error starting transaction:", err);
            return res
                .status(500)
                .json({ success: false, message: "Internal Server Error" });
        }
        // Check if General info for the user with the given ID exists
        const checkUserSql = "SELECT * FROM general_info WHERE id = ?";
        db_1.default.query(checkUserSql, [userId], (err, userResults) => {
            if (err) {
                console.error("Error checking General info:", err);
                db_1.default.rollback(() => {
                    res.status(500).json({ success: false, message: err === null || err === void 0 ? void 0 : err.message });
                });
                return;
            }
            const userCount = userResults.length;
            // If General info doesn't exist, send an error response
            if (userCount === 0) {
                db_1.default.rollback(() => {
                    res
                        .status(404)
                        .json({ success: false, message: "General info not found" });
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
            const updateSql = `UPDATE general_info SET ${updateFields.join(", ")} WHERE id = ?`;
            updateValues.push(userId);
            // Execute the update query within the transaction
            db_1.default.query(updateSql, updateValues, (err, results) => {
                if (err) {
                    console.error("Error updating General info:", err);
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
const deleteGeneralInfo = (req, res) => {
    const userId = req.params.id; // Assuming you pass the user ID in the URL
    // Check if general_info for the user with the given ID exists
    const checkUserSql = "SELECT COUNT(*) AS userCount FROM general_info WHERE id = ?";
    db_1.default.query(checkUserSql, [userId], (err, userResults) => {
        if (err) {
            console.error("Error checking General info:", err);
            return res.status(500).json({ success: false, message: err === null || err === void 0 ? void 0 : err.message });
        }
        const userCount = userResults[0].userCount;
        // If general_info doesn't exist, send an error response
        if (userCount === 0) {
            return res
                .status(404)
                .json({ success: false, message: "general_info not found" });
        }
        // If General info exists, proceed with the deletion
        const deleteSql = "DELETE FROM general_info WHERE id = ?";
        db_1.default.query(deleteSql, [userId], (err, results) => {
            if (err) {
                console.error("Error deleting General info:", err);
                res
                    .status(500)
                    .json({ success: false, message: "Internal Server Error" });
            }
            else {
                res.status(200).json({
                    success: true,
                    message: "General info deleted successfully",
                });
            }
        });
    });
};
exports.GeneralInfoController = {
    getGeneralInfo,
    getSingleGeneralInfo,
    createGeneralInfo,
    updateGeneralInfo,
    deleteGeneralInfo,
};
