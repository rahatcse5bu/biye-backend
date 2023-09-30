"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BioChoiceDataController = void 0;
const db_1 = __importDefault(require("../../../config/db"));
const SendSuccess_1 = require("../../../shared/SendSuccess");
const generatePlaceholders_1 = require("../../../utils/generatePlaceholders");
const bio_choice_data_constant_1 = require("./bio_choice_data.constant");
const getBioChoiceData = (req, res) => {
    const sql = "SELECT * FROM bio_choice_data";
    db_1.default.query(sql, (err, rows) => {
        if (err) {
            res.send({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        res
            .status(200)
            .json((0, SendSuccess_1.sendSuccess)("All Bio choice data  retrieved successfully", rows));
    });
};
const getSingleBioChoiceData = (req, res) => {
    const userId = req.params.id; // Assuming you pass the user ID as a route parameter
    const sql = "SELECT * FROM bio_choice_data WHERE id = ?";
    db_1.default.query(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        if (rows.length === 0) {
            return res.status(404).json({
                message: "Bio choice data not found",
                success: false,
            });
        }
        res
            .status(200)
            .json((0, SendSuccess_1.sendSuccess)("Bio choice data retrieved", rows, 200));
    });
};
const createBioChoiceData = (req, res) => {
    const data = req.body;
    // Insert bio_choice_datarmation into the database
    const insertSql = `INSERT INTO bio_choice_data (
    	${bio_choice_data_constant_1.BioChoiceDataFields.join(",")}
  ) VALUES (${(0, generatePlaceholders_1.generatePlaceholders)(bio_choice_data_constant_1.BioChoiceDataFields.length)})`;
    const BioChoiceData = [];
    bio_choice_data_constant_1.BioChoiceDataFields.forEach((field) => {
        BioChoiceData.push(data[field]);
    });
    db_1.default.query(insertSql, BioChoiceData, (err, results) => {
        if (err) {
            console.error("Error inserting Bio choice data:", err);
            res
                .status(500)
                .json({ success: false, message: "Internal Server Error" });
        }
        else {
            res.status(201).json({
                success: true,
                message: "Bio choice data created successfully",
            });
        }
    });
};
const updateBioChoiceData = (req, res) => {
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
        // Check if Bio choice data for the user with the given ID exists
        const checkUserSql = "SELECT * FROM bio_choice_data WHERE id = ?";
        db_1.default.query(checkUserSql, [userId], (err, userResults) => {
            if (err) {
                console.error("Error checking Bio choice data:", err);
                db_1.default.rollback(() => {
                    res.status(500).json({ success: false, message: err === null || err === void 0 ? void 0 : err.message });
                });
                return;
            }
            const userCount = userResults.length;
            // If Bio choice data doesn't exist, send an error response
            if (userCount === 0) {
                db_1.default.rollback(() => {
                    res.status(404).json({
                        success: false,
                        message: "Bio choice data not found",
                    });
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
            const updateSql = `UPDATE bio_choice_data SET ${updateFields.join(", ")} WHERE id = ?`;
            updateValues.push(userId);
            // Execute the update query within the transaction
            db_1.default.query(updateSql, updateValues, (err, results) => {
                if (err) {
                    console.error("Error updating Bio choice data:", err);
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
const deleteBioChoiceData = (req, res) => {
    const userId = req.params.id; // Assuming you pass the user ID in the URL
    // Check if bio_choice_data for the user with the given ID exists
    const checkUserSql = "SELECT COUNT(*) AS userCount FROM bio_choice_data WHERE id = ?";
    db_1.default.query(checkUserSql, [userId], (err, userResults) => {
        if (err) {
            console.error("Error checking Bio choice data:", err);
            return res.status(500).json({ success: false, message: err === null || err === void 0 ? void 0 : err.message });
        }
        const userCount = userResults[0].userCount;
        // If bio_choice_data doesn't exist, send an error response
        if (userCount === 0) {
            return res.status(404).json({
                success: false,
                message: "bio_choice_data not found",
            });
        }
        // If Bio choice data exists, proceed with the deletion
        const deleteSql = "DELETE FROM bio_choice_data WHERE id = ?";
        db_1.default.query(deleteSql, [userId], (err, results) => {
            if (err) {
                console.error("Error deleting Bio choice data:", err);
                res
                    .status(500)
                    .json({ success: false, message: "Internal Server Error" });
            }
            else {
                res.status(200).json({
                    success: true,
                    message: "Bio choice data deleted successfully",
                });
            }
        });
    });
};
exports.BioChoiceDataController = {
    getBioChoiceData,
    getSingleBioChoiceData,
    createBioChoiceData,
    updateBioChoiceData,
    deleteBioChoiceData,
};
