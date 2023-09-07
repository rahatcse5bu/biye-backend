"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OccupationController = void 0;
const db_1 = __importDefault(require("../../../config/db"));
const SendSuccess_1 = require("../../../shared/SendSuccess");
const getOccupation = (req, res) => {
    const sql = 'SELECT * FROM occupation';
    db_1.default.query(sql, (err, rows) => {
        if (err) {
            res.send({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        res.status(200).json((0, SendSuccess_1.sendSuccess)('All Occupation  retrieved successfully', rows));
    });
};
const getSingleOccupation = (req, res) => {
    const userId = req.params.id; // Assuming you pass the user ID as a route parameter
    const sql = 'SELECT * FROM occupation WHERE id = ?';
    db_1.default.query(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Occupation not found',
                success: false,
            });
        }
        res.status(200).json((0, SendSuccess_1.sendSuccess)('Occupation retrieved', rows, 200));
    });
};
const createOccupation = (req, res) => {
    const data = req.body;
    // Insert Occupationrmation into the database
    const insertSql = `INSERT INTO occupation (
    	user_id,occupation,occupation_details,monthly_income
  ) VALUES (?, ?, ?, ?)`;
    db_1.default.query(insertSql, [
        data.user_id,
        data.occupation,
        data.occupation_details,
        data.monthly_income
    ], (err, results) => {
        if (err) {
            console.error('Error inserting Occupation:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
        else {
            res.status(201).json({ success: true, message: 'Occupation created successfully' });
        }
    });
};
const updateOccupation = (req, res) => {
    const data = req.body;
    const userId = req.params.id; // Assuming you pass the user ID in the URL
    console.log(data);
    // Begin a database transaction
    db_1.default.beginTransaction((err) => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
        // Check if Occupation for the user with the given ID exists
        const checkUserSql = 'SELECT * FROM occupation WHERE id = ?';
        db_1.default.query(checkUserSql, [userId], (err, userResults) => {
            if (err) {
                console.error('Error checking Occupation:', err);
                db_1.default.rollback(() => {
                    res.status(500).json({ success: false, message: err === null || err === void 0 ? void 0 : err.message });
                });
                return;
            }
            const userCount = userResults.length;
            // If Occupation doesn't exist, send an error response
            if (userCount === 0) {
                db_1.default.rollback(() => {
                    res.status(404).json({ success: false, message: 'Occupation not found' });
                });
                return;
            }
            const currentUserData = userResults[0];
            // Build the update SQL statement dynamically based on changed values
            const updateFields = [];
            const updateValues = [];
            Object.keys(data).forEach(key => {
                updateFields.push(`${key} = ?`);
                updateValues.push(data[key]);
            });
            if (updateFields.length === 0) {
                // No fields to update
                db_1.default.commit(() => {
                    res.status(200).json({ success: true, message: 'No changes to update' });
                });
                return;
            }
            // Construct the final update SQL statement
            const updateSql = `UPDATE occupation SET ${updateFields.join(', ')} WHERE id = ?`;
            updateValues.push(userId);
            // Execute the update query within the transaction
            db_1.default.query(updateSql, updateValues, (err, results) => {
                if (err) {
                    console.error('Error updating Occupation:', err);
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
const deleteOccupation = (req, res) => {
    const userId = req.params.id; // Assuming you pass the user ID in the URL
    // Check if Occupation for the user with the given ID exists
    const checkUserSql = 'SELECT COUNT(*) AS userCount FROM occupation WHERE id = ?';
    db_1.default.query(checkUserSql, [userId], (err, userResults) => {
        if (err) {
            console.error('Error checking Occupation:', err);
            return res.status(500).json({ success: false, message: err === null || err === void 0 ? void 0 : err.message });
        }
        const userCount = userResults[0].userCount;
        // If Occupation doesn't exist, send an error response
        if (userCount === 0) {
            return res.status(404).json({ success: false, message: 'Occupation not found' });
        }
        // If Occupation exists, proceed with the deletion
        const deleteSql = 'DELETE FROM occupation WHERE id = ?';
        db_1.default.query(deleteSql, [userId], (err, results) => {
            if (err) {
                console.error('Error deleting Occupation:', err);
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
            else {
                res.status(200).json({ success: true, message: 'Occupation deleted successfully' });
            }
        });
    });
};
exports.OccupationController = {
    getOccupation,
    getSingleOccupation,
    createOccupation,
    updateOccupation,
    deleteOccupation,
};
