"use strict";
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
exports.GeneralInfoController = void 0;
const db_1 = __importDefault(require("../../../config/db"));
const SendSuccess_1 = require("../../../shared/SendSuccess");
const generatePlaceholders_1 = require("../../../utils/generatePlaceholders");
const general_info_constant_1 = require("./general_info.constant");
const http_status_1 = __importDefault(require("http-status"));
const getGeneralInfo = (req, res) => {
    const { bio_type, marital_status, zilla } = req.query;
    let conditions = "";
    if (bio_type) {
        conditions += `general_info.bio_type = '${bio_type}' AND `;
    }
    if (marital_status) {
        conditions += `general_info.marital_status = '${marital_status}' AND `;
    }
    if (zilla) {
        conditions += `general_info.zilla = '${zilla}' AND `;
    }
    if (conditions) {
        conditions = conditions.slice(0, -5);
        conditions = "WHERE " + conditions;
    }
    const sql = `SELECT general_info.bio_type,general_info.user_id, general_info.gender , general_info.height , general_info.date_of_birth , general_info.screen_color  FROM general_info JOIN address ON general_info.user_id = address.user_id JOIN expected_lifepartner ON general_info.user_id = expected_lifepartner.user_id  ${conditions}`;
    // db.query<RowDataPacket[]>(tempSql, (err, rows) => {
    // 	if (err) {
    // 		console.log(err);
    // 	}
    // 	console.log(rows);
    // });
    // console.log(tempSql);
    // let sql = `SELECT * FROM general_info`;
    // console.log({ conditions });
    // console.log({ sql });
    db_1.default.query(sql, (err, rows) => {
        if (err) {
            return res.send({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        res
            .status(200)
            .json((0, SendSuccess_1.sendSuccess)("All General info  retrieved successfully", rows));
    });
};
const getGeneralInfoByUserId = (req, res) => {
    const userId = req.params.id; // Assuming the user_id is in the route parameter
    const sql = "SELECT * FROM general_info WHERE user_id = ?";
    db_1.default.query(sql, [userId], (err, rows) => {
        if (err) {
            res.send({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        else {
            if (rows.length === 0) {
                res.status(404).json({
                    message: "General info not found for the specified user_id",
                    success: false,
                });
            }
            else {
                res.status(200).json({
                    message: "General info retrieved successfully",
                    success: true,
                    data: rows[0], // Assuming you expect only one row per user_id
                });
            }
        }
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
    var _a, _b;
    const data = req.body;
    const { user_form } = data, others = __rest(data, ["user_form"]);
    let user_id = null;
    // console.log(req.user);
    const tokenId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.token_id) !== null && _b !== void 0 ? _b : null;
    if (!tokenId) {
        return res.status(401).send({
            statusCode: http_status_1.default.UNAUTHORIZED,
            message: "You are not authorized",
            success: false,
        });
    }
    // Start a transaction
    db_1.default.beginTransaction((err) => {
        if (err) {
            console.error("Error starting transaction:", err);
            return res
                .status(500)
                .json({ success: false, message: "Internal Server Error", error: err });
        }
        // get user id using token id
        const getUserIdByTokenSql = `select id from user_info where token_id = ?`;
        db_1.default.query(getUserIdByTokenSql, [tokenId], (err, result) => {
            var _a;
            if (err) {
                return rollbackAndRespond(res, db_1.default, null, {
                    success: false,
                    message: "You are not authorized",
                    error: err,
                });
            }
            console.log(result);
            user_id = (_a = result[0]) === null || _a === void 0 ? void 0 : _a.id;
            // Check if the user_id already exists in the database
            const checkSql = "SELECT COUNT(*) AS count FROM general_info WHERE user_id = ?";
            db_1.default.query(checkSql, [user_id], (err, results) => {
                if (err) {
                    console.error("Error checking User Id:", err);
                    return rollbackAndRespond(res, db_1.default, err);
                }
                const count = results[0].count;
                if (count > 0) {
                    // User with this user_id already exists, return an error response
                    return rollbackAndRespond(res, db_1.default, null, {
                        success: false,
                        message: "User with this user id already exists",
                    });
                }
                // Insert general_information into the database
                const insertSql = `INSERT INTO general_info (${general_info_constant_1.GeneralInfoFields.join(",")}) VALUES (${(0, generatePlaceholders_1.generatePlaceholders)(general_info_constant_1.GeneralInfoFields.length)})`;
                const GeneralInfo = [];
                general_info_constant_1.GeneralInfoFields.forEach((field) => {
                    GeneralInfo.push(data[field]);
                });
                // Insert general information
                db_1.default.query(insertSql, GeneralInfo, (err, results) => {
                    if (err) {
                        console.error("Error inserting General info:", err);
                        return rollbackAndRespond(res, db_1.default, err);
                    }
                    // Update the fields edited_timeline_index and last_edited_timeline_index of user_info table
                    const updateUserInfoSql = `
        UPDATE user_info SET edited_timeline_index = CASE WHEN ${user_form} > edited_timeline_index THEN ${user_form} ELSE edited_timeline_index END,last_edited_timeline_index = ${user_form} WHERE id=?
      `;
                    db_1.default.query(updateUserInfoSql, [user_id], (err, results) => {
                        if (err) {
                            console.error("Error updating user_info:", err);
                            return rollbackAndRespond(res, db_1.default, err);
                        }
                        // Commit the transaction if everything is successful
                        db_1.default.commit((err) => {
                            if (err) {
                                console.error("Error committing transaction:", err);
                                return rollbackAndRespond(res, db_1.default, err);
                            }
                            res.status(201).json({
                                success: true,
                                message: "General info created and user_info updated successfully",
                            });
                        });
                    });
                });
            });
        });
    });
};
// Helper function to rollback the transaction and respond with an error
function rollbackAndRespond(res, db, err, responseObj) {
    db.rollback(() => {
        console.error("Transaction rolled back due to error:", err);
        if (responseObj) {
            res.status(500).json(responseObj);
        }
        else {
            res
                .status(500)
                .json({ success: false, message: "Internal Server Error", error: err });
        }
    });
}
const updateGeneralInfo = (req, res) => {
    var _a, _b;
    const data = req.body;
    const token_id = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.token_id) !== null && _b !== void 0 ? _b : null;
    let user_id = null;
    if (!token_id) {
        return res.status(401).send({
            statusCode: http_status_1.default.UNAUTHORIZED,
            message: "You are not authorized",
            success: false,
        });
    }
    // Begin a database transaction
    db_1.default.beginTransaction((err) => {
        if (err) {
            console.error("Error starting transaction:", err);
            return res
                .status(500)
                .json({ success: false, message: "Internal Server Error", error: err });
        }
        // get user id using token id
        const getUserIdByTokenSql = `select id from user_info where token_id = ?`;
        db_1.default.query(getUserIdByTokenSql, [token_id], (err, result) => {
            var _a;
            if (err) {
                return rollbackAndRespond(res, db_1.default, null, {
                    success: false,
                    message: "You are not authorized",
                    error: err,
                });
            }
            console.log(result);
            user_id = Number((_a = result[0]) === null || _a === void 0 ? void 0 : _a.id);
            if (isNaN(user_id)) {
                return rollbackAndRespond(res, db_1.default, null, {
                    success: false,
                    message: "You are not authorized",
                    error: err,
                });
            }
            // Check if General info for the user with the given ID exists
            const checkUserSql = "SELECT * FROM general_info WHERE user_id = ?";
            db_1.default.query(checkUserSql, [user_id], (err, userResults) => {
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
                const updateSql = `UPDATE general_info SET ${updateFields.join(", ")} WHERE user_id = ?`;
                updateValues.push(user_id);
                // Execute the update query within the transaction
                db_1.default.query(updateSql, updateValues, (err, results) => {
                    if (err) {
                        console.error("Error updating General info:", err);
                        db_1.default.rollback(() => {
                            res.status(500).json({
                                success: false,
                                message: "Internal Server Error",
                                error: err,
                            });
                        });
                    }
                    else {
                        // Commit the transaction if the update was successful
                        db_1.default.commit(() => {
                            res.status(200).json({
                                message: "Update successfully completed",
                                success: true,
                                data: results,
                            });
                        });
                    }
                });
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
            return res
                .status(500)
                .json({ success: false, message: err === null || err === void 0 ? void 0 : err.message, error: err });
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
                res.status(500).json({
                    success: false,
                    message: "Internal Server Error",
                    error: err,
                });
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
    getGeneralInfoByUserId,
};
