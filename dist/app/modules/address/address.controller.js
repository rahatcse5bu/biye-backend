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
const http_status_1 = __importDefault(require("http-status"));
const response_1 = require("../../../utils/response");
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
    var _a;
    const data = req.body;
    const token_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.token_id;
    const { user_form } = data;
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
        //! get user_id using token_id
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
            //! Check if the user_id already exists in the database
            const checkSql = "SELECT COUNT(*) AS count FROM address WHERE user_id = ?";
            db_1.default.query(checkSql, [user_id], (err, results) => {
                if (err) {
                    console.error("Error checking User Id:", err);
                    return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                }
                const count = results[0].count;
                if (count > 0) {
                    //! User with this user_id already exists, return an error response
                    return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                        success: false,
                        message: "User with this user id already exists",
                    });
                }
                //! Insert address into the database
                const insertSql = `INSERT INTO address (${address_constant_1.AddressFields.join(",")}) VALUES (${(0, generatePlaceholders_1.generatePlaceholders)(address_constant_1.AddressFields.length)})`;
                const AddressInfo = [];
                address_constant_1.AddressFields.forEach((field) => {
                    AddressInfo.push(data[field]);
                });
                //! Insert address information
                db_1.default.query(insertSql, AddressInfo, (err, results) => {
                    if (err) {
                        console.error("Error inserting General info:", err);
                        return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                    }
                    //! Update the fields edited_timeline_index and last_edited_timeline_index of user_info table
                    const updateUserInfoSql = `
            UPDATE user_info SET edited_timeline_index = CASE WHEN ${user_form} > edited_timeline_index THEN ${user_form} ELSE edited_timeline_index END,last_edited_timeline_index = ${user_form} WHERE id=?
          `;
                    db_1.default.query(updateUserInfoSql, [user_id], (err, results) => {
                        if (err) {
                            console.error("Error updating user_info:", err);
                            return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                        }
                        // Commit the transaction if everything is successful
                        db_1.default.commit((err) => {
                            if (err) {
                                console.error("Error committing transaction:", err);
                                return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
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
const updateAddress = (req, res) => {
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
    //! Begin a database transaction
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
                return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                    success: false,
                    message: "You are not authorized",
                    error: err,
                });
            }
            console.log(result);
            user_id = Number((_a = result[0]) === null || _a === void 0 ? void 0 : _a.id);
            if (isNaN(user_id)) {
                return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                    success: false,
                    message: "You are not authorized",
                    error: err,
                });
            }
            //! Check if General info for the user with the given ID exists
            const checkUserSql = "SELECT user_id FROM address WHERE user_id = ?";
            db_1.default.query(checkUserSql, [user_id], (err, userResults) => {
                if (err) {
                    console.error("Error checking address info:", err);
                    db_1.default.rollback(() => {
                        res.status(500).json({ success: false, message: err === null || err === void 0 ? void 0 : err.message });
                    });
                    return;
                }
                const userCount = userResults.length;
                //! If address info doesn't exist, send an error response
                if (userCount === 0) {
                    db_1.default.rollback(() => {
                        res
                            .status(404)
                            .json({ success: false, message: "Address info not found" });
                    });
                    return;
                }
                //! Build the update SQL statement dynamically based on changed values
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
                const updateSql = `UPDATE address SET ${updateFields.join(", ")} WHERE user_id = ?`;
                updateValues.push(user_id);
                // Execute the update query within the transaction
                db_1.default.query(updateSql, updateValues, (err, results) => {
                    if (err) {
                        console.error("Error updating address info:", err);
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
const getAddressInfoByUserId = (req, res) => {
    const userId = req.params.id; // Assuming the user_id is in the route parameter
    const sql = "SELECT * FROM address WHERE user_id = ?";
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
                    message: "Address info not found for the specified user_id",
                    success: false,
                });
            }
            else {
                res.status(200).json({
                    message: "Address info retrieved successfully",
                    success: true,
                    data: rows[0], // Assuming you expect only one row per user_id
                });
            }
        }
    });
};
exports.AddressController = {
    getAddress,
    getSingleAddress,
    createAddress,
    updateAddress,
    deleteAddress,
    getAddressInfoByUserId,
};
