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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserInfoController = void 0;
const db_1 = __importDefault(require("../../../config/db"));
// @ts-ignore
const uuid_1 = require("uuid");
const SendSuccess_1 = require("../../../shared/SendSuccess");
const user_info_constant_1 = require("./user_info.constant");
const generatePlaceholders_1 = require("../../../utils/generatePlaceholders");
const jwtHelpers_1 = require("../../../helpers/jwtHelpers");
const config_1 = __importDefault(require("../../../config"));
const http_status_1 = __importDefault(require("http-status"));
const response_1 = require("../../../utils/response");
const addUniqueId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = (0, uuid_1.v4)();
    const updateSql = `
      UPDATE user_info
      SET token_id = ?`;
    // Specify the values you want to update in an array
    const values = [id];
    db_1.default.query(updateSql, values, (error, results) => {
        if (error) {
            res.send({ error: error });
        }
        else {
            res.send(results);
        }
    });
});
const getUserInfo = (req, res) => {
    const sql = `select id,token_id,user_status,email,user_role,edited_timeline_index,points,last_edited_timeline_index from user_info`;
    db_1.default.query(sql, (err, rows) => {
        if (err) {
            res.send({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        res
            .status(201)
            .json((0, SendSuccess_1.sendSuccess)("All user info retrieved successfully", rows));
    });
};
const getUserInfoByEmail = (req, res) => {
    const email = req.params.email; // Assuming you pass the user ID as a route parameter
    const sql = `SELECT id,token_id,user_status,email,user_role,edited_timeline_index,points,last_edited_timeline_index  FROM user_info WHERE email = ?`;
    db_1.default.query(sql, [email], (err, rows) => {
        if (err) {
            return res.status(500).json({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
                error: err,
            });
        }
        if (rows.length === 0) {
            return res.status(404).json({
                message: "User not found",
                success: false,
            });
        }
        res
            .status(200)
            .json((0, SendSuccess_1.sendSuccess)("single user retrieved", rows, 200));
    });
};
const createUserForGoogleSignIn = (req, res) => {
    let data = req.body;
    data = Object.assign(Object.assign({}, data), { token_id: (0, uuid_1.v4)() });
    //! Start a database transaction
    db_1.default.beginTransaction((err) => {
        if (err) {
            console.error("Error starting transaction:", err);
            return res.status(500).json({
                success: false,
                message: "Server error",
                error: err,
            });
        }
        //! First, check if the email already exists
        const checkEmailSql = "SELECT COUNT(*) AS emailCount FROM user_info WHERE email = ?";
        db_1.default.query(checkEmailSql, [data.email], (err, emailResults) => {
            if (err) {
                console.error("Error checking email:", err);
                return db_1.default.rollback(() => {
                    res.status(500).json({
                        success: false,
                        message: "Server error",
                        error: err,
                    });
                });
            }
            const emailCount = emailResults[0].emailCount;
            //! If the email already exists, send an error response
            if (emailCount > 0) {
                //! Generate the SQL update statement dynamically based on the provided fields
                const updateFields = [];
                const updateValues = [];
                Object.keys(data).forEach((key) => {
                    updateFields.push(`${key} = ?`);
                    updateValues.push(data[key]);
                });
                if (updateFields.length === 0) {
                    //! No fields to update
                    return db_1.default.rollback(() => {
                        res.status(400).json({
                            success: true,
                            message: "No update data provided",
                        });
                    });
                }
                //! Execute the update query within the transaction
                const updateSql = `UPDATE user_info SET ${updateFields.join(", ")} WHERE email = ?`;
                const updateParams = [...updateValues, data === null || data === void 0 ? void 0 : data.email];
                db_1.default.query(updateSql, updateParams, (err, results) => {
                    if (err) {
                        console.error("Error updating data:", err);
                        db_1.default.rollback(() => {
                            res.status(500).json({
                                success: false,
                                message: "Server error",
                                error: err,
                            });
                        });
                    }
                    else {
                        const getUserInfoSql = "select token_id, user_role from user_info where email=?";
                        db_1.default.query(getUserInfoSql, [data === null || data === void 0 ? void 0 : data.email], (err, user) => {
                            if (err) {
                                console.error("Error updating data:", err);
                                db_1.default.rollback(() => {
                                    res.status(500).json({
                                        success: false,
                                        message: "Server error",
                                        error: err,
                                    });
                                });
                            }
                            console.log(user);
                            //! Commit the transaction if the update was successful
                            db_1.default.commit((err) => {
                                var _a, _b;
                                if (err) {
                                    console.error("Error committing transaction:", err);
                                    db_1.default.rollback(() => {
                                        res
                                            .status(500)
                                            .json({ success: false, message: "Server error" });
                                    });
                                }
                                else {
                                    res.json({
                                        success: true,
                                        message: "User information updated successfully",
                                        token: jwtHelpers_1.jwtHelpers.createToken({
                                            token_id: (_a = user[0]) === null || _a === void 0 ? void 0 : _a.token_id,
                                            user_role: (_b = user[0]) === null || _b === void 0 ? void 0 : _b.user_role,
                                        }, config_1.default.jwt_secret, "7d"),
                                    });
                                }
                            });
                        });
                    }
                });
            }
            else {
                // If the email doesn't exist, proceed with the insertion
                const insertSql = `INSERT INTO user_info (${user_info_constant_1.UserInfoFields.join(",")}) VALUES (${(0, generatePlaceholders_1.generatePlaceholders)(user_info_constant_1.UserInfoFields.length)})`;
                const UserInfoData = [];
                user_info_constant_1.UserInfoFields.forEach((field) => {
                    UserInfoData.push(data[field]);
                });
                // Execute the insert query within the transaction
                db_1.default.query(insertSql, UserInfoData, (err, results) => {
                    if (err) {
                        console.error("Error inserting data:", err);
                        db_1.default.rollback(() => {
                            res.status(500).json({
                                success: false,
                                message: "Something went wrong",
                                error: err,
                            });
                        });
                    }
                    else {
                        const getUserInfoSql = "select token_id, user_role from user_info where email=?";
                        // Commit the transaction if the insertion was successful
                        db_1.default.query(getUserInfoSql, [data === null || data === void 0 ? void 0 : data.email], (err, user) => {
                            if (err) {
                                console.error("Error updating data:", err);
                                db_1.default.rollback(() => {
                                    res.status(500).json({
                                        success: false,
                                        message: "Server error",
                                        error: err,
                                    });
                                });
                            }
                            console.log(user);
                            //! Commit the transaction if the update was successful
                            db_1.default.commit((err) => {
                                var _a, _b;
                                if (err) {
                                    console.error("Error committing transaction:", err);
                                    db_1.default.rollback(() => {
                                        res
                                            .status(500)
                                            .json({ success: false, message: "Server error" });
                                    });
                                }
                                else {
                                    res.json({
                                        success: true,
                                        message: "User information updated successfully",
                                        token: jwtHelpers_1.jwtHelpers.createToken({
                                            token_id: (_a = user[0]) === null || _a === void 0 ? void 0 : _a.token_id,
                                            user_role: (_b = user[0]) === null || _b === void 0 ? void 0 : _b.user_role,
                                        }, config_1.default.jwt_secret, "7d"),
                                    });
                                }
                            });
                        });
                    }
                });
            }
        });
    });
};
const getSingleUserInfo = (req, res) => {
    const userId = req.params.id; // Assuming you pass the user ID as a route parameter
    const sql = `SELECT id,token_id,email,user_status,user_role,points,edited_timeline_index,last_edited_timeline_index  FROM user_info WHERE id = ?`;
    db_1.default.query(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        if (rows.length === 0) {
            return res.status(404).json({
                message: "User not found",
                success: false,
            });
        }
        res
            .status(200)
            .json((0, SendSuccess_1.sendSuccess)("single user retrieved", rows, 200));
    });
};
const createUserInfo = (req, res) => {
    let data = req.body;
    data = Object.assign(Object.assign({}, data), { token_id: (0, uuid_1.v4)() });
    const checkEmailSql = "SELECT COUNT(*) AS emailCount FROM user_info WHERE email = ?";
    // First, check if the email already exists
    db_1.default.query(checkEmailSql, [data.email], (err, emailResults) => {
        if (err) {
            console.error("Error checking email:", err);
            return res.send({
                success: false,
                message: "Something went wrong.",
                error: err,
            });
        }
        const emailCount = emailResults[0].emailCount;
        console.log(emailResults);
        // If the email already exists, send an error response
        if (emailCount > 0) {
            return res
                .status(400)
                .json({ success: false, message: "Email already exists" });
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
                    error: err,
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
                return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                    success: false,
                    message: "You are not authorized",
                    error: err,
                });
            }
            // console.log(result);
            user_id = Number((_a = result[0]) === null || _a === void 0 ? void 0 : _a.id);
            if (isNaN(user_id)) {
                return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                    success: false,
                    message: "You are not authorized",
                    error: err,
                });
            }
            // Check if General info for the user with the given ID exists
            const checkUserSql = "SELECT * FROM user_info WHERE id = ?";
            db_1.default.query(checkUserSql, [user_id], (err, userResults) => {
                if (err) {
                    console.error("Error checking user info:", err);
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
                            .json({ success: false, message: "User info not found" });
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
                const updateSql = `UPDATE user_info SET ${updateFields.join(", ")} WHERE id = ?`;
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
const getUserStatus = (req, res) => {
    const id = req.params.id;
    const sql = "SELECT user_status from user_info WHERE id = ?";
    db_1.default.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error checking General info:", err);
            return res
                .status(500)
                .json({ success: false, message: err === null || err === void 0 ? void 0 : err.message, error: err });
        }
        res.status(200).json({
            message: "user status",
            success: true,
            data: result[0],
        });
    });
};
exports.UserInfoController = {
    getUserInfo,
    createUserInfo,
    updateUserInfo,
    deleteUserInfo,
    getSingleUserInfo,
    createUserForGoogleSignIn,
    getUserInfoByEmail,
    addUniqueId,
    getUserStatus,
};
