"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnFavoritesController = void 0;
const db_1 = __importDefault(require("../../../config/db"));
const SendSuccess_1 = require("../../../shared/SendSuccess");
const http_status_1 = __importDefault(require("http-status"));
const response_1 = require("../../../utils/response");
const getUnFavoritesListByUserId = (req, res) => {
    var _a;
    const token_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.token_id;
    let user_id = null;
    if (!token_id) {
        return res.status(401).send({
            statusCode: http_status_1.default.UNAUTHORIZED,
            message: "You are not authorized",
            success: false,
        });
    }
    //! Get user_id using token_id
    const getUserIdByTokenSql = `SELECT id FROM user_info WHERE token_id = ?`;
    db_1.default.query(getUserIdByTokenSql, [token_id], (err, result) => {
        var _a;
        if (err) {
            return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                success: false,
                message: "You are not authorized",
                error: err,
            });
        }
        user_id = (_a = result[0]) === null || _a === void 0 ? void 0 : _a.id;
        //? get all bio data that likes an users
        // const sql1 = `SELECT unfavorites.user_id,unfavorites.bio_id,address.permanent_address, general_info.date_of_birth,general_info.screen_color  from unfavorites
        // 	LEFT JOIN address ON unfavorites.bio_id = address.user_id
        // 	LEFT JOIN general_info ON unfavorites.bio_id = general_info.user_id
        // 	LEFT JOIN bio_choice_data ON unfavorites.bio_id = bio_choice_data.user_id
        // 	where unfavorites.user_id = ?
        // 	`;
        const sql1 = `SELECT DISTINCT
    f.user_id,
    f.bio_id,
    a.permanent_address,
    gf.date_of_birth,
    gf.screen_color,
    (
        SELECT COUNT(*) *100
        FROM bio_choice_data bc 
        WHERE bc.bio_id = f.bio_id
    ) AS total_count,
    (
        SELECT COUNT(*) 
        FROM bio_choice_data bc 
        WHERE (bc.bio_id = f.bio_id AND bc.status = 'Pending') OR (bc.bio_id = f.bio_id AND bc.status = 'pending')
    ) AS total_pending,
    (
        SELECT COUNT(*) 
        FROM bio_choice_data bc 
        WHERE (bc.bio_id = f.bio_id AND bc.status = 'Approved') OR (bc.bio_id = f.bio_id AND bc.status = 'approved')
    ) AS total_approved, 
    (
        SELECT COUNT(*) 
        FROM bio_choice_data bc 
        WHERE (bc.bio_id = f.bio_id AND bc.status = 'Rejected') OR (bc.bio_id = f.bio_id AND bc.status = 'rejected')
    ) AS total_rejected,
    COALESCE(
        (
            SELECT (COUNT(*) * 100)
            FROM bio_choice_data bc 
            WHERE (bc.bio_id = f.bio_id AND bc.status = 'Approved') OR (bc.bio_id = f.bio_id AND bc.status = 'approved')
        ) / (
            SELECT COUNT(*) 
            FROM bio_choice_data bc 
            WHERE bc.bio_id = f.bio_id
        ), 0
    ) AS approval_rate,
    COALESCE(
        (
            SELECT (COUNT(*) * 100)
            FROM bio_choice_data bc 
            WHERE (bc.bio_id = f.bio_id AND bc.status = 'Rejected') OR (bc.bio_id = f.bio_id AND bc.status = 'rejected')
        ) / (
            SELECT COUNT(*) 
            FROM bio_choice_data bc 
            WHERE bc.bio_id = f.bio_id
        ), 0
    ) AS rejection_rate
FROM unfavorites AS f
JOIN address AS a ON f.bio_id = a.user_id
JOIN general_info AS gf ON f.bio_id = gf.user_id
WHERE f.user_id = ? AND f.bio_id <> ?`;
        db_1.default.query(sql1, [user_id, user_id], (err, result) => {
            if (err) {
                console.error("Error updating unfavorites:", err);
                return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
            }
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error committing transaction:", err);
                    return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                }
                res.status(201).json({
                    success: true,
                    message: "UnFavorites created successfully",
                    data: result,
                });
            });
        });
    });
};
const getUnFavoritesByUserId = (req, res) => {
    const user_id = req.params.userId;
    const bio_id = req.params.bioId;
    const sql = "SELECT type FROM unfavorites WHERE user_id = ? AND bio_id = ?";
    db_1.default.query(sql, [user_id, bio_id], (err, rows) => {
        if (err) {
            return res.send({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        res
            .status(200)
            .json((0, SendSuccess_1.sendSuccess)("unfavorites  retrieved successfully", rows[0]));
    });
};
const getUnFavoritesCountByBioId = (req, res) => {
    const bio_id = req.params.id;
    console.log(bio_id);
    const sql = "SELECT COUNT(*) AS count FROM unfavorites WHERE bio_id = ? AND type = ?"; // Updated SQL query
    db_1.default.query(sql, [bio_id, "like"], (err, rows) => {
        console.log(err);
        if (err) {
            return res.send({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        const count = rows[0].count; // Extract the count from the result
        res.status(200).json({
            success: true,
            count: count,
        });
    });
};
const getSingleUnFavorites = (req, res) => {
    const userId = req.params.id; // Assuming you pass the user ID as a route parameter
    const sql = "SELECT * FROM unfavorites WHERE id = ?";
    db_1.default.query(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        if (rows.length === 0) {
            return res.status(404).json({
                message: "unfavorites not found",
                success: false,
            });
        }
        res
            .status(200)
            .json((0, SendSuccess_1.sendSuccess)("unfavorites retrieved", rows, 200));
    });
};
const createUnFavorites = (req, res) => {
    var _a;
    const { bio_id } = req.body;
    const token_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.token_id;
    let user_id = null;
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
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: err,
            });
        }
        //! Get user_id using token_id
        const getUserIdByTokenSql = `SELECT id FROM user_info WHERE token_id = ?`;
        db_1.default.query(getUserIdByTokenSql, [token_id], (err, result) => {
            var _a;
            if (err) {
                return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                    success: false,
                    message: "You are not authorized",
                    error: err,
                });
            }
            user_id = (_a = result[0]) === null || _a === void 0 ? void 0 : _a.id;
            //? get type from unfavorites
            const getTypeSql = "SELECT type from unfavorites where user_id = ? AND bio_id = ?";
            db_1.default.query(getTypeSql, [user_id, bio_id], (err, result) => {
                var _a;
                if (err) {
                    console.error("Error updating unfavorites:", err);
                    return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                }
                //! If existing type is 'gnore', update it to 'not-ignore', and vice versa
                if (result.length) {
                    const newType = ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.type) === "ignore" ? "not-ignore" : "ignore";
                    const updateSql = `UPDATE unfavorites SET type=?  WHERE user_id = ? AND bio_id=?`;
                    db_1.default.query(updateSql, [newType, user_id, bio_id], (err, results) => {
                        if (err) {
                            console.error("Error updating unfavorites:", err);
                            return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                        }
                        db_1.default.commit((err) => {
                            if (err) {
                                console.error("Error committing transaction:", err);
                                return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                            }
                            res.status(201).json({
                                success: true,
                                message: "UnFavorites updated successfully",
                                data: results,
                            });
                        });
                    });
                }
                else {
                    const createSql = `Insert into unfavorites(user_id,bio_id,type) values(?,?,?)`;
                    db_1.default.query(createSql, [user_id, bio_id, "ignore"], (err, results) => {
                        if (err) {
                            console.error("Error updating unfavorites:", err);
                            return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                        }
                        db_1.default.commit((err) => {
                            if (err) {
                                console.error("Error committing transaction:", err);
                                return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                            }
                            res.status(201).json({
                                success: true,
                                message: "UnFavorites created successfully",
                                data: results,
                            });
                        });
                    });
                }
            });
        });
    });
};
const updateUnFavorites = (req, res) => {
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
            const checkUserSql = "SELECT user_id FROM unfavorites WHERE user_id = ?";
            db_1.default.query(checkUserSql, [user_id], (err, userResults) => {
                if (err) {
                    console.error("Error checking UnFavorites:", err);
                    db_1.default.rollback(() => {
                        res.status(500).json({ success: false, message: err === null || err === void 0 ? void 0 : err.message });
                    });
                    return;
                }
                const userCount = userResults.length;
                //! If UnFavorites doesn't exist, send an error response
                if (userCount === 0) {
                    db_1.default.rollback(() => {
                        res.status(404).json({
                            success: false,
                            message: "UnFavorites not found",
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
                const updateSql = `UPDATE unfavorites SET ${updateFields.join(", ")} WHERE user_id = ?`;
                updateValues.push(user_id);
                // Execute the update query within the transaction
                db_1.default.query(updateSql, updateValues, (err, results) => {
                    if (err) {
                        console.error("Error updating UnFavorites:", err);
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
const deleteUnFavorites = (req, res) => {
    const userId = req.params.id; // Assuming you pass the user ID in the URL
    // Check if unfavorites for the user with the given ID exists
    const checkUserSql = "SELECT COUNT(*) AS userCount FROM unfavorites WHERE id = ?";
    db_1.default.query(checkUserSql, [userId], (err, userResults) => {
        if (err) {
            console.error("Error checking unfavorites:", err);
            return res.status(500).json({ success: false, message: err === null || err === void 0 ? void 0 : err.message });
        }
        const userCount = userResults[0].userCount;
        // If unfavorites doesn't exist, send an error response
        if (userCount === 0) {
            return res
                .status(404)
                .json({ success: false, message: "unfavorites not found" });
        }
        // If unfavorites exists, proceed with the deletion
        const deleteSql = "DELETE FROM unfavorites WHERE id = ?";
        db_1.default.query(deleteSql, [userId], (err, results) => {
            if (err) {
                console.error("Error deleting unfavorites:", err);
                res
                    .status(500)
                    .json({ success: false, message: "Internal Server Error" });
            }
            else {
                res
                    .status(200)
                    .json({ success: true, message: "unfavorites deleted successfully" });
            }
        });
    });
};
exports.UnFavoritesController = {
    getSingleUnFavorites,
    createUnFavorites,
    updateUnFavorites,
    deleteUnFavorites,
    getUnFavoritesByUserId,
    getUnFavoritesCountByBioId,
    getUnFavoritesListByUserId,
};
