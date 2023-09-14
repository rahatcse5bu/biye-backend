"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalInfoController = void 0;
const db_1 = __importDefault(require("../../../config/db"));
const SendSuccess_1 = require("../../../shared/SendSuccess");
const personal_info_constant_1 = require("./personal_info.constant");
const generatePlaceholders_1 = require("../../../utils/generatePlaceholders");
const getPersonalInfo = (req, res) => {
    const sql = 'SELECT * FROM personal_info';
    db_1.default.query(sql, (err, rows) => {
        if (err) {
            res.send({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        res.status(200).json((0, SendSuccess_1.sendSuccess)('All personal info retrieved successfully', rows));
    });
};
const getSinglePersonalInfo = (req, res) => {
    const userId = req.params.id; // Assuming you pass the user ID as a route parameter
    const sql = 'SELECT * FROM personal_info WHERE id = ?';
    db_1.default.query(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Personal info not found',
                success: false,
            });
        }
        res.status(200).json((0, SendSuccess_1.sendSuccess)('Personal info retrieved', rows, 200));
    });
};
const createPersonalInfo = (req, res) => {
    const data = req.body;
    // Insert personal information into the database
    const insertSql = `INSERT INTO personal_info (
    ${personal_info_constant_1.PersonalInfoFields.join(",")}
) VALUES (${(0, generatePlaceholders_1.generatePlaceholders)(personal_info_constant_1.PersonalInfoFields.length)})`;
    const personalInfo = [];
    personal_info_constant_1.PersonalInfoFields.forEach((field) => {
        personalInfo.push(data[field]);
    });
    db_1.default.query(insertSql, personalInfo, (err, results) => {
        if (err) {
            console.error('Error inserting personal info:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
        else {
            res.status(201).json({ success: true, message: 'Personal info created successfully' });
        }
    });
};
const updatePersonalInfo = (req, res) => {
    const data = req.body;
    const userId = req.params.id; // Assuming you pass the user ID in the URL
    // Begin a database transaction
    db_1.default.beginTransaction((err) => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
        // Check if personal info for the user with the given ID exists
        const checkUserSql = 'SELECT * FROM personal_info WHERE id = ?';
        db_1.default.query(checkUserSql, [userId], (err, userResults) => {
            if (err) {
                console.error('Error checking personal info:', err);
                db_1.default.rollback(() => {
                    res.status(500).json({ success: false, message: err === null || err === void 0 ? void 0 : err.message });
                });
                return;
            }
            const userCount = userResults.length;
            // If personal info doesn't exist, send an error response
            if (userCount === 0) {
                db_1.default.rollback(() => {
                    res.status(404).json({ success: false, message: 'Personal info not found' });
                });
                return;
            }
            const currentUserData = userResults[0];
            // Build the update SQL statement dynamically based on changed values
            const updateFields = [];
            const updateValues = [];
            for (const key in data) {
                if (data[key] && (data[key] !== currentUserData[key])) {
                    updateFields.push(`${key} = ?`);
                    updateValues.push(data[key]);
                }
            }
            if (updateFields.length === 0) {
                // No fields to update
                db_1.default.commit(() => {
                    res.status(200).json({ success: true, message: 'No changes to update' });
                });
                return;
            }
            // Construct the final update SQL statement
            const updateSql = `UPDATE personal_info SET ${updateFields.join(', ')} WHERE id = ?`;
            updateValues.push(userId);
            // Execute the update query within the transaction
            db_1.default.query(updateSql, updateValues, (err, results) => {
                if (err) {
                    console.error('Error updating personal info:', err);
                    db_1.default.rollback(() => {
                        res.status(500).json({ success: false, message: 'Internal Server Error' });
                    });
                }
                else {
                    // Commit the transaction if the update was successful
                    db_1.default.commit(() => {
                        res.status(200).json((0, SendSuccess_1.sendSuccess)("Update sucessfully completed", results, 200));
                    });
                }
            });
        });
    });
};
const deletePersonalInfo = (req, res) => {
    const userId = req.params.id; // Assuming you pass the user ID in the URL
    // Check if personal info for the user with the given ID exists
    const checkUserSql = 'SELECT COUNT(*) AS userCount FROM personal_info WHERE id = ?';
    db_1.default.query(checkUserSql, [userId], (err, userResults) => {
        if (err) {
            console.error('Error checking personal info:', err);
            return res.status(500).json({ success: false, message: err === null || err === void 0 ? void 0 : err.message });
        }
        const userCount = userResults[0].userCount;
        // If personal info doesn't exist, send an error response
        if (userCount === 0) {
            return res.status(404).json({ success: false, message: 'Personal info not found' });
        }
        // If personal info exists, proceed with the deletion
        const deleteSql = 'DELETE FROM personal_info WHERE id = ?';
        db_1.default.query(deleteSql, [userId], (err, results) => {
            if (err) {
                console.error('Error deleting personal info:', err);
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
            else {
                res.status(200).json({ success: true, message: 'Personal info deleted successfully' });
            }
        });
    });
};
exports.PersonalInfoController = {
    getPersonalInfo,
    getSinglePersonalInfo,
    createPersonalInfo,
    updatePersonalInfo,
    deletePersonalInfo,
};
