"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BioChoiceDataController = void 0;
const db_1 = __importDefault(require("../../../config/db"));
const SendSuccess_1 = require("../../../shared/SendSuccess");
const generatePlaceholders_1 = require("../../../utils/generatePlaceholders");
const response_1 = require("../../../utils/response");
const http_status_1 = __importDefault(require("http-status"));
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
const getBioChoiceStatisticsData = (req, res) => {
    const bioId = req.params.id;
    const rejectedSql = `SELECT COUNT(*) AS rejectedCount FROM bio_choice_data WHERE status = 'Rejected' AND bio_id =? `;
    let responseResults = {};
    db_1.default.beginTransaction((err) => {
        if (err) {
            return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                success: false,
                message: "Something went wrong",
                error: err,
            });
        }
        db_1.default.query(rejectedSql, [bioId], (err, results) => {
            var _a;
            if (err) {
                return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                    success: false,
                    message: "Something went wrong",
                    error: err,
                });
            }
            responseResults = Object.assign(Object.assign({}, responseResults), { rejected: (_a = results[0]) === null || _a === void 0 ? void 0 : _a.rejectedCount });
            const approvedSql = `SELECT COUNT(*) AS approvedCount FROM bio_choice_data WHERE status = 'Approved' AND bio_id=? `;
            db_1.default.query(approvedSql, [bioId], (err, results) => {
                var _a;
                if (err) {
                    return db_1.default.rollback(() => {
                        res.send({
                            message: err === null || err === void 0 ? void 0 : err.message,
                            success: false,
                            error: err,
                        });
                    });
                }
                responseResults = Object.assign(Object.assign({}, responseResults), { approved: (_a = results[0]) === null || _a === void 0 ? void 0 : _a.approvedCount });
                const pendingSql = `SELECT COUNT(*) AS pendingCount FROM bio_choice_data WHERE status = 'Pending' AND bio_id=? `;
                db_1.default.query(pendingSql, [bioId], (err, results) => {
                    var _a;
                    if (err) {
                        return db_1.default.rollback(() => {
                            res.send({
                                message: err === null || err === void 0 ? void 0 : err.message,
                                success: false,
                                error: err,
                            });
                        });
                    }
                    responseResults = Object.assign(Object.assign({}, responseResults), { pending: (_a = results[0]) === null || _a === void 0 ? void 0 : _a.pendingCount });
                    db_1.default.commit((err) => {
                        if (err) {
                            return db_1.default.rollback(() => {
                                throw err;
                            });
                        }
                        res.status(200).json({
                            success: true,
                            results: responseResults,
                            message: "All statistics retrieve successfully",
                        });
                    });
                });
            });
        });
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
    var _a;
    let data = req.body;
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
            const checkSql = "SELECT COUNT(*) AS count FROM bio_choice_data WHERE user_id = ? AND bio_id = ?";
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
                        message: "You already requested",
                    });
                }
                data = Object.assign(Object.assign({}, data), { user_id });
                const keys = Object.keys(data);
                const values = Object.values(data);
                //! Insert  into the database
                const insertSql = `INSERT INTO bio_choice_data (${keys.join(",")}) VALUES (${(0, generatePlaceholders_1.generatePlaceholders)(values.length)})`;
                const bio_choice_data = [];
                keys.forEach((field) => {
                    bio_choice_data.push(data[field]);
                });
                //! Insert bio choice data  information
                db_1.default.query(insertSql, bio_choice_data, (err, results) => {
                    if (err) {
                        console.error("Error inserting Occupation:", err);
                        return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                    }
                    // ! reduced points
                    const updateUserInfoSql = `UPDATE user_info SET points = points - ? WHERE id=?`;
                    db_1.default.query(updateUserInfoSql, [30, user_id], (err, results) => {
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
                                message: "Bio Choice data created successfully",
                            });
                        });
                    });
                });
            });
        });
    });
};
const updateBioChoiceData = (req, res) => {
    var _a, _b, _c;
    const bio_id = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
    const data = req.body;
    const token_id = (_c = (_b = req.user) === null || _b === void 0 ? void 0 : _b.token_id) !== null && _c !== void 0 ? _c : null;
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
            const checkUserSql = "SELECT COUNT(*) as rowCount FROM bio_choice_data WHERE user_id = ? AND bio_id = ?";
            db_1.default.query(checkUserSql, [bio_id, user_id], (err, rows) => {
                if (err) {
                    console.error("Error checking Contact:", err);
                    db_1.default.rollback(() => {
                        res.status(500).json({ success: false, message: err === null || err === void 0 ? void 0 : err.message });
                    });
                    return;
                }
                const count = rows[0].rowCount;
                //! If Contact doesn't exist, send an error response
                if (count === 0) {
                    db_1.default.rollback(() => {
                        res.status(404).json({
                            success: false,
                            message: "bio choice data not found",
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
                const updateSql = `UPDATE bio_choice_data SET ${updateFields.join(", ")} WHERE user_id = ? AND bio_id = ?`;
                updateValues.push(bio_id);
                updateValues.push(user_id);
                // Execute the update query within the transaction
                db_1.default.query(updateSql, updateValues, (err, results) => {
                    if (err) {
                        console.error("Error updating Contact:", err);
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
const getBioChoiceDataOfFirstStep = (req, res) => {
    var _a;
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
            //! get bio choice data first step
            const getSqlFirstStep = `
				SELECT subquery.bio_id,a.permanent_area,a.present_area,a.zilla,a.upzilla,a.division,a.city,
				subquery.status,subquery.feedback,subquery.bio_details,
				COUNT(main.user_id) AS total_count,
				SUM(CASE WHEN main.status = 'Approved' THEN 1 ELSE 0 END) AS approval_count,
				SUM(CASE WHEN main.status = 'Rejected' THEN 1 ELSE 0 END) AS rejection_count,
				SUM(CASE WHEN main.status = 'Pending' THEN 1 ELSE 0 END) AS pending_count,
				CASE
        WHEN COUNT(main.user_id) - SUM(CASE WHEN main.status = 'Pending' THEN 1 ELSE 0 END) = 0
        THEN 0.0
        ELSE
            (
                SUM(CASE WHEN main.status = 'Approved' THEN 1 ELSE 0 END) * 100.0
            ) / (
                COUNT(main.user_id) - SUM(CASE WHEN main.status = 'Pending' THEN 1 ELSE 0 END)
            )
				END AS approval_rate,
				CASE
        WHEN COUNT(main.user_id) - SUM(CASE WHEN main.status = 'Pending' THEN 1 ELSE 0 END) = 0
        THEN 0.0
        ELSE
            (
                SUM(CASE WHEN main.status = 'Rejected' THEN 1 ELSE 0 END) * 100.0
            ) / (
                COUNT(main.user_id) - SUM(CASE WHEN main.status = 'Pending' THEN 1 ELSE 0 END)
            )
								END AS rejection_rate
						FROM (
								SELECT DISTINCT *
								FROM bio_choice_data
								WHERE user_id = ? AND bio_id <> ?
						) AS subquery
						LEFT JOIN bio_choice_data AS main ON subquery.bio_id = main.user_id LEFT JOIN address a ON a.user_id=subquery.bio_id
						GROUP BY subquery.bio_id;
				
				`;
            db_1.default.query(getSqlFirstStep, [user_id, user_id], (err, results) => {
                if (err) {
                    console.error("Error checking User Id:", err);
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
                        message: "Bio Choice first step data get successfully",
                        data: results,
                    });
                });
            });
        });
    });
};
const getBioChoiceDataOfSecondStep = (req, res) => {
    var _a;
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
            //! get bio choice data of second step
            const getSqlSecondStep = `
				SELECT
    subquery.bio_id,p.reason,a.permanent_area as permanent_address,a.present_area as present_address,a.zilla as zilla,a.upzilla as upzilla,a.division as divison,a.city as city,gi.date_of_birth as date_of_birth, c.full_name,c.family_number,c.relation,
    subquery.status as choice_bio_status,subquery.feedback,subquery.bio_details,
    COUNT(main.user_id) AS total_count,
    SUM(CASE WHEN main.status = 'Approved' THEN 1 ELSE 0 END) AS approval_count,
    SUM(CASE WHEN main.status = 'Rejected' THEN 1 ELSE 0 END) AS rejection_count,
    SUM(CASE WHEN main.status = 'Pending' THEN 1 ELSE 0 END) AS pending_count,
    CASE
        WHEN COUNT(main.user_id) - SUM(CASE WHEN main.status = 'Pending' THEN 1 ELSE 0 END) = 0
        THEN 0.0
        ELSE
            (
                SUM(CASE WHEN main.status = 'Approved' THEN 1 ELSE 0 END) * 100.0
            ) / (
                COUNT(main.user_id) - SUM(CASE WHEN main.status = 'Pending' THEN 1 ELSE 0 END)
            )
    END AS approval_rate,
    CASE
        WHEN COUNT(main.user_id) - SUM(CASE WHEN main.status = 'Pending' THEN 1 ELSE 0 END) = 0
        THEN 0.0
        ELSE
            (
                SUM(CASE WHEN main.status = 'Rejected' THEN 1 ELSE 0 END) * 100.0
            ) / (
                COUNT(main.user_id) - SUM(CASE WHEN main.status = 'Pending' THEN 1 ELSE 0 END)
            )
						END AS rejection_rate
				FROM (
						SELECT DISTINCT *
						FROM bio_choice_data
						WHERE user_id = ? AND bio_id <> ?
				) AS subquery
				LEFT JOIN bio_choice_data AS main ON subquery.bio_id = main.user_id LEFT JOIN address a ON a.user_id=subquery.bio_id LEFT JOIN contact c on c.user_id=subquery.bio_id LEFT JOIN  general_info gi ON gi.user_id=subquery.bio_id LEFT JOIN contact_purchase_data cpd ON cpd.user_id=? LEFT JOIN payments p ON (p.user_id= ? AND p.transaction_id=cpd.transaction_id AND cpd.bio_id=subquery.bio_id) WHERE (p.reason='contact_purchase' AND p.status='Completed' AND p.refund_status <> 'refunded' OR p.refund_status NOT LIKE '%processing%') AND subquery.status='Approved'
				GROUP BY subquery.bio_id;
				`;
            db_1.default.query(getSqlSecondStep, [user_id, user_id, user_id, user_id], (err, results) => {
                if (err) {
                    console.error("Error checking User Id:", err);
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
                        message: "Bio Choice second step data get successfully",
                        data: results,
                    });
                });
            });
        });
    });
};
const getBioChoiceDataOfShare = (req, res) => {
    var _a;
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
            //! get bio choice data of share
            const getSqlOfShare = `SELECT DISTINCT bc.user_id, gi.date_of_birth as date_of_birth,bc.bio_details, bc.status, bc.feedback,address.present_address,address.city,address.present_area FROM bio_choice_data as bc LEFT JOIN general_info as gi ON gi.user_id = bc.user_id LEFT JOIN address ON address.user_id = bc.user_id WHERE bc.user_id IN ( SELECT DISTINCT user_id FROM bio_choice_data WHERE bio_id = ? AND user_id <> ? ) GROUP By bc.user_id;`;
            db_1.default.query(getSqlOfShare, [user_id, user_id], (err, results) => {
                if (err) {
                    console.error("Error checking User Id:", err);
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
                        message: "Bio Choice of share data get successfully",
                        data: results,
                    });
                });
            });
        });
    });
};
const checkBioChoiceDataOfFirstStep = (req, res) => {
    var _a;
    const token_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.token_id;
    const bio_id = req.params.id;
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
            //! get bio choice data of second step
            const checkSqlFirstStep = "SELECT COUNT(*) as count , bcd.status FROM `bio_choice_data` bcd WHERE bcd.user_id= ? AND bcd.bio_id = ?";
            db_1.default.query(checkSqlFirstStep, [user_id, bio_id], (err, results) => {
                if (err) {
                    console.error("Error checking User Id:", err);
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
                        message: "Bio Choice check first step data get successfully",
                        data: results[0],
                    });
                });
            });
        });
    });
};
const checkBioChoiceDataOfSecondStep = (req, res) => {
    var _a;
    const token_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.token_id;
    const bio_id = req.params.id;
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
            //! get bio choice data of second step
            const checkSqlSecondStep = "SELECT COUNT(*) as count,p.status as payment_status, p.refund_status as refund_status FROM payments p LEFT JOIN contact_purchase_data cpd on (p.user_id=cpd.user_id AND p.transaction_id=cpd.transaction_id) WHERE p.status='Completed' AND p.refund_status NOT LIKE '%processing%' AND p.reason='contact_purchase' AND p.user_id=? AND cpd.bio_id=?";
            db_1.default.query(checkSqlSecondStep, [user_id, bio_id], (err, results) => {
                if (err) {
                    console.error("Error checking User Id:", err);
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
                        message: "Bio Choice check second step data get successfully",
                        data: results[0],
                    });
                });
            });
        });
    });
};
exports.BioChoiceDataController = {
    getBioChoiceData,
    getSingleBioChoiceData,
    createBioChoiceData,
    updateBioChoiceData,
    deleteBioChoiceData,
    getBioChoiceStatisticsData,
    getBioChoiceDataOfFirstStep,
    getBioChoiceDataOfSecondStep,
    checkBioChoiceDataOfFirstStep,
    checkBioChoiceDataOfSecondStep,
    getBioChoiceDataOfShare,
};
