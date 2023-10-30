"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactPurchaseDataController = void 0;
const db_1 = __importDefault(require("../../../config/db"));
const SendSuccess_1 = require("../../../shared/SendSuccess");
const generatePlaceholders_1 = require("../../../utils/generatePlaceholders");
const response_1 = require("../../../utils/response");
const http_status_1 = __importDefault(require("http-status"));
const getContactPurchaseData = (req, res) => {
    const sql = "SELECT * FROM contact_purchase_data";
    db_1.default.query(sql, (err, rows) => {
        if (err) {
            res.send({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        res
            .status(200)
            .json((0, SendSuccess_1.sendSuccess)("All contact_purchase_data  retrieved successfully", rows));
    });
};
const getSingleContactPurchaseData = (req, res) => {
    const userId = req.params.id; // Assuming you pass the user ID as a route parameter
    const sql = "SELECT * FROM contact_purchase_data WHERE id = ?";
    db_1.default.query(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        if (rows.length === 0) {
            return res.status(404).json({
                message: "contact_purchase_data not found",
                success: false,
            });
        }
        res
            .status(200)
            .json((0, SendSuccess_1.sendSuccess)("contact_purchase_data retrieved", rows, 200));
    });
};
const createContactPurchaseData = (req, res) => {
    var _a;
    const data = req.body;
    const token_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.token_id;
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
            var _a;
            if (err) {
                return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                    success: false,
                    message: "You are not authorized",
                    error: err,
                });
            }
            //console.log(result);
            user_id = (_a = result[0]) === null || _a === void 0 ? void 0 : _a.id;
            if (!user_id) {
                return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                    success: false,
                    message: "You are not authorized",
                    error: err,
                });
            }
            //! Check if the user_id already exists in the database
            const checkSql = "SELECT COUNT(*) AS count FROM contact_purchase_data WHERE user_id = ? AND bio_id = ?";
            db_1.default.query(checkSql, [user_id, data === null || data === void 0 ? void 0 : data.bio_id], (err, results) => {
                if (err) {
                    console.error("Error checking User Id:", err);
                    return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                }
                const count = results[0].count;
                if (count > 0) {
                    //! User with this user_id already exists, return an error response
                    return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                        success: false,
                        message: "Already purchase this bio data",
                    });
                }
                const keys = Object.keys(data);
                const values = Object.values(data);
                //! Insert  into the database
                const insertSql = `INSERT INTO contact_purchase_data (${keys.join(",")}) VALUES (${(0, generatePlaceholders_1.generatePlaceholders)(values.length)})`;
                const contact_purchase_data = [];
                keys.forEach((field) => {
                    contact_purchase_data.push(data[field]);
                });
                //! Insert ContactPurchaseData information
                db_1.default.query(insertSql, contact_purchase_data, (err, results) => {
                    if (err) {
                        console.error("Error inserting Contact Purchase Data :", err);
                        return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                    }
                    const updateUserInfoSql = `UPDATE user_info SET points = points - ? WHERE id=?`;
                    db_1.default.query(updateUserInfoSql, [70, user_id], (err, results) => {
                        if (err) {
                            console.error("Error inserting Contact Purchase Data :", err);
                            return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                        }
                        db_1.default.commit((err) => {
                            if (err) {
                                console.error("Error committing transaction:", err);
                                return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                            }
                            res.status(201).json({
                                success: true,
                                message: "Contact Purchase Data created successfully",
                                data: results,
                            });
                        });
                    });
                });
            });
        });
    });
};
const updateContactPurchaseData = (req, res) => {
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
            //! Check if Expected Life Partner for the user with the given ID exists
            const checkUserSql = "SELECT user_id FROM contact_purchase_data WHERE user_id = ?";
            db_1.default.query(checkUserSql, [user_id], (err, userResults) => {
                if (err) {
                    console.error("Error checking ContactPurchaseData:", err);
                    db_1.default.rollback(() => {
                        res.status(500).json({ success: false, message: err === null || err === void 0 ? void 0 : err.message });
                    });
                    return;
                }
                const userCount = userResults.length;
                //! If ContactPurchaseData doesn't exist, send an error response
                if (userCount === 0) {
                    db_1.default.rollback(() => {
                        res.status(404).json({
                            success: false,
                            message: "ContactPurchaseData not found",
                        });
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
                const updateSql = `UPDATE contact_purchase_data SET ${updateFields.join(", ")} WHERE user_id = ?`;
                updateValues.push(user_id);
                // Execute the update query within the transaction
                db_1.default.query(updateSql, updateValues, (err, results) => {
                    if (err) {
                        console.error("Error updating ContactPurchaseData:", err);
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
const deleteContactPurchaseData = (req, res) => {
    const userId = req.params.id; // Assuming you pass the user ID in the URL
    // Check if contact_purchase_data for the user with the given ID exists
    const checkUserSql = "SELECT COUNT(*) AS userCount FROM contact_purchase_data WHERE id = ?";
    db_1.default.query(checkUserSql, [userId], (err, userResults) => {
        if (err) {
            console.error("Error checking contact_purchase_data:", err);
            return res.status(500).json({ success: false, message: err === null || err === void 0 ? void 0 : err.message });
        }
        const userCount = userResults[0].userCount;
        // If contact_purchase_data doesn't exist, send an error response
        if (userCount === 0) {
            return res
                .status(404)
                .json({ success: false, message: "contact_purchase_data not found" });
        }
        // If contact_purchase_data exists, proceed with the deletion
        const deleteSql = "DELETE FROM contact_purchase_data WHERE id = ?";
        db_1.default.query(deleteSql, [userId], (err, results) => {
            if (err) {
                console.error("Error deleting contact_purchase_data:", err);
                res
                    .status(500)
                    .json({ success: false, message: "Internal Server Error" });
            }
            else {
                res.status(200).json({
                    success: true,
                    message: "contact_purchase_data deleted successfully",
                });
            }
        });
    });
};
const getContactPurchaseDataByUserId = (req, res) => {
    var _a, _b;
    const id = Number(req.params.id); // Assuming the user_id is in the route parameter
    const token_id = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.token_id) !== null && _b !== void 0 ? _b : null;
    let user_id = null;
    // console.log("token-id-contact_purchase_data", token_id);
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
            // console.log(result);
            user_id = Number((_a = result[0]) === null || _a === void 0 ? void 0 : _a.id);
            if (isNaN(user_id) || user_id !== id) {
                return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                    success: false,
                    message: "You are not authorized",
                    error: err,
                });
            }
            const contact_purchase_dataSql = "SELECT * FROM contact_purchase_data WHERE user_id = ?";
            db_1.default.query(contact_purchase_dataSql, [user_id], (err, contact_purchase_data) => {
                if (err) {
                    console.error("Error checking ContactPurchaseData:", err);
                    return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                        success: false,
                        message: "You are not authorized",
                        error: err,
                    });
                }
                if ((contact_purchase_data === null || contact_purchase_data === void 0 ? void 0 : contact_purchase_data.length) === 0) {
                    return res.status(404).json({
                        message: "ContactPurchaseData not found for the specified user_id",
                        success: false,
                        data: null,
                    });
                }
                // Commit the transaction if the update was successful
                db_1.default.commit(() => {
                    res.status(200).json({
                        message: "ContactPurchaseData retrieved successfully",
                        success: true,
                        data: contact_purchase_data[0],
                    });
                });
            });
        });
    });
};
const getContactPurchaseDataForBuyer = (req, res) => {
    var _a, _b;
    const id = Number(req.params.userId); // Assuming the user_id is in the route parameter
    const bio_id = Number(req.params.bioId);
    const token_id = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.token_id) !== null && _b !== void 0 ? _b : null;
    let user_id = null;
    // console.log("token-id-contact_purchase_data", token_id);
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
            // console.log(result);
            user_id = Number((_a = result[0]) === null || _a === void 0 ? void 0 : _a.id);
            if (isNaN(user_id) || user_id !== id) {
                return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                    success: false,
                    message: "You are not authorized",
                    error: err,
                });
            }
            const contact_purchase_dataSql = "SELECT COUNT(*) as row_count,p.status as payment_status, p.refund_status as refund_status,c.full_name,c.family_number,c.relation FROM payments p  INNER JOIN contact_purchase_data_purchase_data cpd on (p.user_id=cpd.user_id AND p.transaction_id=cpd.transaction_id) INNER JOIN `bio_choice_data` bcd ON (bcd.user_id= cpd.user_id AND bcd.bio_id=cpd.bio_id AND cpd.user_id=p.user_id) LEFT JOIN contact_purchase_data c ON (bcd.bio_id=c.user_id AND cpd.bio_id=c.user_id) WHERE p.status='Completed' AND p.refund_status NOT LIKE '%processing%' AND p.refund_status NOT LIKE '%refunded%' AND p.reason='contact_purchase_data_purchase' AND p.user_id=? AND cpd.bio_id=?";
            db_1.default.query(contact_purchase_dataSql, [user_id, bio_id], (err, contact_purchase_data) => {
                var _a;
                if (err) {
                    console.error("Error checking :", err);
                    return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                        success: false,
                        message: "You are not authorized",
                        error: err,
                    });
                }
                if (((_a = contact_purchase_data[0]) === null || _a === void 0 ? void 0 : _a.row_count) >= 1) {
                    const getContactPurchaseDataSql = `select * from contact_purchase_data where user_id = ?`;
                    db_1.default.query(getContactPurchaseDataSql, [bio_id], (err, contact_purchase_data) => {
                        if (err) {
                            return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                                success: false,
                                message: err === null || err === void 0 ? void 0 : err.message,
                                error: err,
                            });
                        }
                        db_1.default.commit(() => {
                            res.status(200).json({
                                message: "ContactPurchaseData retrieved successfully",
                                success: true,
                                data: contact_purchase_data[0],
                            });
                        });
                    });
                }
                else {
                    // Commit the transaction if the update was successful
                    db_1.default.commit(() => {
                        res.status(200).json({
                            message: "ContactPurchaseData retrieved successfully",
                            success: true,
                            data: null,
                        });
                    });
                }
            });
        });
    });
};
exports.ContactPurchaseDataController = {
    getContactPurchaseData,
    getSingleContactPurchaseData,
    createContactPurchaseData,
    updateContactPurchaseData,
    deleteContactPurchaseData,
    getContactPurchaseDataByUserId,
    getContactPurchaseDataForBuyer,
};
