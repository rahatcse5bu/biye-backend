"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactController = void 0;
const db_1 = __importDefault(require("../../../config/db"));
const SendSuccess_1 = require("../../../shared/SendSuccess");
const generatePlaceholders_1 = require("../../../utils/generatePlaceholders");
const contact_constant_1 = require("./contact.constant");
const getContact = (req, res) => {
    const sql = "SELECT * FROM contact";
    db_1.default.query(sql, (err, rows) => {
        if (err) {
            res.send({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        res
            .status(200)
            .json((0, SendSuccess_1.sendSuccess)("All contact  retrieved successfully", rows));
    });
};
const getSingleContact = (req, res) => {
    const userId = req.params.id; // Assuming you pass the user ID as a route parameter
    const sql = "SELECT * FROM contact WHERE id = ?";
    db_1.default.query(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        if (rows.length === 0) {
            return res.status(404).json({
                message: "contact not found",
                success: false,
            });
        }
        res
            .status(200)
            .json((0, SendSuccess_1.sendSuccess)("contact retrieved", rows, 200));
    });
};
const createContact = (req, res) => {
    const data = req.body;
    // Insert bio_choice_datarmation into the database
    const insertSql = `INSERT INTO contact (
    	${contact_constant_1.ContactFields.join(",")}
  ) VALUES (${(0, generatePlaceholders_1.generatePlaceholders)(contact_constant_1.ContactFields.length)})`;
    const BioChoiceData = [];
    contact_constant_1.ContactFields.forEach((field) => {
        BioChoiceData.push(data[field]);
    });
    db_1.default.query(insertSql, BioChoiceData, (err, results) => {
        if (err) {
            console.error("Error inserting Contact:", err);
            res
                .status(500)
                .json({ success: false, message: "Internal Server Error" });
        }
        else {
            res.status(201).json({
                success: true,
                message: "Contact created successfully",
            });
        }
    });
};
const updateContact = (req, res) => {
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
        // Check if contact for the user with the given ID exists
        const checkUserSql = "SELECT * FROM contact WHERE id = ?";
        db_1.default.query(checkUserSql, [userId], (err, userResults) => {
            if (err) {
                console.error("Error checking contact:", err);
                db_1.default.rollback(() => {
                    res.status(500).json({ success: false, message: err === null || err === void 0 ? void 0 : err.message });
                });
                return;
            }
            const userCount = userResults.length;
            // If contact doesn't exist, send an error response
            if (userCount === 0) {
                db_1.default.rollback(() => {
                    res
                        .status(404)
                        .json({ success: false, message: "contact not found" });
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
            const updateSql = `UPDATE contact SET ${updateFields.join(", ")} WHERE id = ?`;
            updateValues.push(userId);
            // Execute the update query within the transaction
            db_1.default.query(updateSql, updateValues, (err, results) => {
                if (err) {
                    console.error("Error updating contact:", err);
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
const deleteContact = (req, res) => {
    const userId = req.params.id; // Assuming you pass the user ID in the URL
    // Check if contact for the user with the given ID exists
    const checkUserSql = "SELECT COUNT(*) AS userCount FROM contact WHERE id = ?";
    db_1.default.query(checkUserSql, [userId], (err, userResults) => {
        if (err) {
            console.error("Error checking contact:", err);
            return res.status(500).json({ success: false, message: err === null || err === void 0 ? void 0 : err.message });
        }
        const userCount = userResults[0].userCount;
        // If contact doesn't exist, send an error response
        if (userCount === 0) {
            return res
                .status(404)
                .json({ success: false, message: "contact not found" });
        }
        // If contact exists, proceed with the deletion
        const deleteSql = "DELETE FROM contact WHERE id = ?";
        db_1.default.query(deleteSql, [userId], (err, results) => {
            if (err) {
                console.error("Error deleting contact:", err);
                res
                    .status(500)
                    .json({ success: false, message: "Internal Server Error" });
            }
            else {
                res
                    .status(200)
                    .json({ success: true, message: "contact deleted successfully" });
            }
        });
    });
};
exports.ContactController = {
    getContact,
    getSingleContact,
    createContact,
    updateContact,
    deleteContact,
};
