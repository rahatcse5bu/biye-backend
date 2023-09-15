"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserInfoController = void 0;
const db_1 = __importDefault(require("../../../config/db"));
const SendSuccess_1 = require("../../../shared/SendSuccess");
const user_info_constant_1 = require("./user_info.constant");
const generatePlaceholders_1 = require("../../../utils/generatePlaceholders");
const getUserInfo = (req, res) => {
    const sql = `select * from user_info`;
    db_1.default.query(sql, (err, rows) => {
        if (err) {
            res.send({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        res.status(201).json((0, SendSuccess_1.sendSuccess)("All user info retrieved successfully", rows));
    });
};
const getSinleUserInfo = (req, res) => {
    const userId = req.params.id; // Assuming you pass the user ID as a route parameter
    const sql = `SELECT * FROM user_info WHERE id = ?`;
    db_1.default.query(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        if (rows.length === 0) {
            return res.status(404).json({
                message: 'User not found',
                success: false,
            });
        }
        res.status(200).json((0, SendSuccess_1.sendSuccess)("single user retrieved", rows, 200));
    });
};
const createUserInfo = (req, res) => {
    const data = req.body;
    const checkEmailSql = "SELECT COUNT(*) AS emailCount FROM user_info WHERE email = ?";
    // First, check if the email already exists
    db_1.default.query(checkEmailSql, [data.email], (err, emailResults) => {
        if (err) {
            console.error("Error checking email:", err);
            return res.send({
                success: false,
                message: "Something went wrong.",
                error: err
            });
        }
        const emailCount = emailResults[0].emailCount;
        console.log(emailResults);
        // If the email already exists, send an error response
        if (emailCount > 0) {
            return res.status(400).json({ success: false, message: "Email already exists" });
        }
        // If the email doesn't exist, proceed with the insertion
        const insertSql = `INSERT INTO user_info (
				${user_info_constant_1.UserInfoFields.join(",")}
		  ) VALUES (${(0, generatePlaceholders_1.generatePlaceholders)(user_info_constant_1.UserInfoFields.length)})`;
        const UserInfoData = [];
        user_info_constant_1.UserInfoFields.forEach((field) => {
            UserInfoData.push(data[field]);
        });
        db_1.default.query(insertSql, UserInfoData, (err, results) => {
            if (err) {
                console.error("Error inserting data:", err);
                res.send({
                    success: false,
                    message: "Something went wrong",
                    error: err
                });
            }
            else {
                res.send({
                    success: true,
                    message: "User info created successfully",
                });
            }
        });
    });
};
const updateUserInfo = (req, res) => {
    const data = req.body;
    const userId = req.params.id; // Assuming you pass the user ID in the URL
    // Check if the user with the given ID exists
    const checkUserSql = "SELECT COUNT(*) AS userCount FROM user_info WHERE id = ?";
    db_1.default.query(checkUserSql, [userId], (err, userResults) => {
        if (err) {
            console.error("Error checking user:", err);
            return res.status(500).json({ success: false, message: "Server error" });
        }
        const userCount = userResults[0].userCount;
        // If the user doesn't exist, send an error response
        if (userCount === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        // Generate the SQL update statement dynamically based on the provided fields
        const updateFields = [];
        const updateValues = [];
        if (data.username) {
            updateFields.push("username = ?");
            updateValues.push(data.username);
        }
        if (data.password) {
            updateFields.push("password = ?");
            updateValues.push(data.password);
        }
        if (data.email) {
            updateFields.push("email = ?");
            updateValues.push(data.email);
        }
        if (data.phone) {
            updateFields.push("phone = ?");
            updateValues.push(data.phone);
        }
        if (updateFields.length === 0) {
            // No fields to update
            return res.status(400).json({ success: false, message: "No update data provided" });
        }
        const updateSql = `UPDATE user_info SET ${updateFields.join(", ")} WHERE id = ?`;
        const updateParams = [...updateValues, userId];
        db_1.default.query(updateSql, updateParams, (err, results) => {
            if (err) {
                console.error("Error updating data:", err);
                res.status(500).json({ success: false, message: "Server error" });
            }
            else {
                res.json({ success: true, message: "User information updated successfully" });
            }
        });
    });
};
const deleteUserInfo = (req, res) => {
    const userId = req.params.id; // Assuming you pass the user ID in the URL
    // Check if the user with the given ID exists
    const checkUserSql = "SELECT COUNT(*) AS userCount FROM user_info WHERE id = ?";
    db_1.default.query(checkUserSql, [userId], (err, userResults) => {
        if (err) {
            console.error("Error checking user:", err);
            return res.send(err);
        }
        const userCount = userResults[0].userCount;
        // If the user doesn't exist, send an error response
        if (userCount === 0) {
            return res.status(404).json({ success: false, error: "User not found" });
        }
        // If the user exists, proceed with the deletion
        const deleteSql = "DELETE FROM user_info WHERE id = ?";
        db_1.default.query(deleteSql, [userId], (err, results) => {
            if (err) {
                console.error("Error deleting user:", err);
                res.send(err);
            }
            else {
                res.send(results);
            }
        });
    });
};
exports.UserInfoController = {
    getUserInfo,
    createUserInfo,
    updateUserInfo,
    deleteUserInfo,
    getSinleUserInfo
};
