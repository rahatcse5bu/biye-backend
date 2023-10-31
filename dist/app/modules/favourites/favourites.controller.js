"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavouritesController = void 0;
const db_1 = __importDefault(require("../../../config/db"));
const SendSuccess_1 = require("../../../shared/SendSuccess");
const http_status_1 = __importDefault(require("http-status"));
const response_1 = require("../../../utils/response");
const getFavouritesListByUserId = (req, res) => {
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
        // const sql1 = `SELECT favourites.user_id,favourites.bio_id,address.permanent_address, general_info.date_of_birth,general_info.screen_color  from favourites
        // 	LEFT JOIN address ON favourites.bio_id = address.user_id
        // 	LEFT JOIN general_info ON favourites.bio_id = general_info.user_id
        // 	LEFT JOIN bio_choice_data ON favourites.bio_id = bio_choice_data.user_id
        // 	where favourites.user_id = ?
        // 	`;
        const sql1 = `SELECT DISTINCT
		f.user_id,
		f.bio_id,
		a.permanent_address,
		gf.date_of_birth,
		gf.screen_color,
		(
			SELECT COUNT(*) 
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
			) / (     (
				SELECT COUNT(*) 
				FROM bio_choice_data bc 
				WHERE bc.bio_id = f.bio_id
			)- (
			SELECT COUNT(*) 
			FROM bio_choice_data bc 
			WHERE (bc.bio_id = f.bio_id AND bc.status = 'Pending') OR (bc.bio_id = f.bio_id AND bc.status = 'pending')
		)), 0
		) AS approval_rate,
		COALESCE(
			(
				SELECT (COUNT(*) * 100)
				FROM bio_choice_data bc 
				WHERE (bc.bio_id = f.bio_id AND bc.status = 'Rejected') OR (bc.bio_id = f.bio_id AND bc.status = 'rejected')
			) / ((
				SELECT COUNT(*) 
				FROM bio_choice_data bc 
				WHERE bc.bio_id = f.bio_id
			)- (
			SELECT COUNT(*) 
			FROM bio_choice_data bc 
			WHERE (bc.bio_id = f.bio_id AND bc.status = 'Pending') OR (bc.bio_id = f.bio_id AND bc.status = 'pending')
		)), 0
		) AS rejection_rate
	FROM favourites AS f
	JOIN address AS a ON f.bio_id = a.user_id
	JOIN general_info AS gf ON f.bio_id = gf.user_id
	WHERE f.user_id = ? AND f.bio_id <> ? AND f.type='like';`;
        db_1.default.query(sql1, [user_id, user_id], (err, result) => {
            if (err) {
                console.error("Error updating favourites:", err);
                return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
            }
            db_1.default.commit((err) => {
                if (err) {
                    console.error("Error committing transaction:", err);
                    return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                }
                res.status(201).json({
                    success: true,
                    message: "Favourites created successfully",
                    data: result,
                });
            });
        });
    });
};
const getFavouritesByWhoByUserId = (req, res) => {
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
            if (!user_id) {
                return (0, response_1.rollbackAndRespond)(res, db_1.default, null, {
                    success: false,
                    message: "You are not authorized",
                    error: err,
                });
            }
            //? get type from favourites
            const getTypeSql = `SELECT DISTINCT
				f.user_id,
				f.bio_id,
				a.permanent_address,
				gf.date_of_birth,
				gf.screen_color,
				(
					SELECT COUNT(*) 
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
					) / (     (
						SELECT COUNT(*) 
						FROM bio_choice_data bc 
						WHERE bc.bio_id = f.bio_id
					)- (
					SELECT COUNT(*) 
					FROM bio_choice_data bc 
					WHERE (bc.bio_id = f.bio_id AND bc.status = 'Pending') OR (bc.bio_id = f.bio_id AND bc.status = 'pending')
				)), 0
				) AS approval_rate,
				COALESCE(
					(
						SELECT (COUNT(*) * 100)
						FROM bio_choice_data bc 
						WHERE (bc.bio_id = f.bio_id AND bc.status = 'Rejected') OR (bc.bio_id = f.bio_id AND bc.status = 'rejected')
					) / ((
						SELECT COUNT(*) 
						FROM bio_choice_data bc 
						WHERE bc.bio_id = f.bio_id
					)- (
					SELECT COUNT(*) 
					FROM bio_choice_data bc 
					WHERE (bc.bio_id = f.bio_id AND bc.status = 'Pending') OR (bc.bio_id = f.bio_id AND bc.status = 'pending')
				)), 0
				) AS rejection_rate
			FROM favourites AS f
			JOIN address AS a ON f.user_id = a.user_id
			JOIN general_info AS gf ON f.user_id = gf.user_id
			WHERE f.bio_id = ? AND f.user_id <> ? AND f.type = 'like';
				
				`;
            db_1.default.query(getTypeSql, [user_id, user_id], (err, result) => {
                if (err) {
                    console.error("Error updating favourites:", err);
                    return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                }
                db_1.default.commit((err) => {
                    if (err) {
                        console.error("Error committing transaction:", err);
                        return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                    }
                    res.status(201).json({
                        success: true,
                        message: "Retrieve all Favourites  successfully",
                        data: result,
                    });
                });
            });
        });
    });
};
const getFavouritesByUserId = (req, res) => {
    const user_id = req.params.userId;
    const bio_id = req.params.bioId;
    const sql = "SELECT type FROM favourites WHERE user_id = ? AND bio_id = ? AND type=?";
    db_1.default.query(sql, [user_id, bio_id, "like"], (err, rows) => {
        if (err) {
            return res.send({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        res
            .status(200)
            .json((0, SendSuccess_1.sendSuccess)("All favourites  retrieved successfully", rows[0]));
    });
};
const getFavouritesCountByBioId = (req, res) => {
    const bio_id = req.params.id;
    console.log(bio_id);
    const sql = "SELECT COUNT(*) AS count FROM favourites WHERE bio_id = ? AND type = ?"; // Updated SQL query
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
const getSingleFavourites = (req, res) => {
    const userId = req.params.id; // Assuming you pass the user ID as a route parameter
    const sql = "SELECT * FROM favourites WHERE id = ?";
    db_1.default.query(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        if (rows.length === 0) {
            return res.status(404).json({
                message: "favourites not found",
                success: false,
            });
        }
        res
            .status(200)
            .json((0, SendSuccess_1.sendSuccess)("favourites retrieved", rows, 200));
    });
};
const createFavourites = (req, res) => {
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
            //? get type from favourites
            const getTypeSql = "SELECT type from favourites where user_id = ? AND bio_id = ?";
            db_1.default.query(getTypeSql, [user_id, bio_id], (err, result) => {
                var _a;
                if (err) {
                    console.error("Error updating favourites:", err);
                    return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                }
                //! If existing type is 'like', update it to 'dislike', and vice versa
                if (result.length) {
                    const newType = ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.type) === "like" ? "not-like" : "like";
                    const updateSql = `UPDATE favourites SET type=?  WHERE user_id = ? AND bio_id=?`;
                    db_1.default.query(updateSql, [newType, user_id, bio_id], (err, results) => {
                        if (err) {
                            console.error("Error updating favourites:", err);
                            return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                        }
                        db_1.default.commit((err) => {
                            if (err) {
                                console.error("Error committing transaction:", err);
                                return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                            }
                            res.status(201).json({
                                success: true,
                                message: "Favourites updated successfully",
                                data: results,
                            });
                        });
                    });
                }
                else {
                    const createSql = `Insert into favourites(user_id,bio_id,type) values(?,?,?)`;
                    db_1.default.query(createSql, [user_id, bio_id, "like"], (err, results) => {
                        if (err) {
                            console.error("Error updating favourites:", err);
                            return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                        }
                        db_1.default.commit((err) => {
                            if (err) {
                                console.error("Error committing transaction:", err);
                                return (0, response_1.rollbackAndRespond)(res, db_1.default, err);
                            }
                            res.status(201).json({
                                success: true,
                                message: "Favourites created successfully",
                                data: results,
                            });
                        });
                    });
                }
            });
        });
    });
};
const updateFavourites = (req, res) => {
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
            const checkUserSql = "SELECT user_id FROM favourites WHERE user_id = ?";
            db_1.default.query(checkUserSql, [user_id], (err, userResults) => {
                if (err) {
                    console.error("Error checking Favourites:", err);
                    db_1.default.rollback(() => {
                        res.status(500).json({ success: false, message: err === null || err === void 0 ? void 0 : err.message });
                    });
                    return;
                }
                const userCount = userResults.length;
                //! If Favourites doesn't exist, send an error response
                if (userCount === 0) {
                    db_1.default.rollback(() => {
                        res.status(404).json({
                            success: false,
                            message: "Favourites not found",
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
                const updateSql = `UPDATE favourites SET ${updateFields.join(", ")} WHERE user_id = ?`;
                updateValues.push(user_id);
                // Execute the update query within the transaction
                db_1.default.query(updateSql, updateValues, (err, results) => {
                    if (err) {
                        console.error("Error updating Favourites:", err);
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
const deleteFavourites = (req, res) => {
    const userId = req.params.id; // Assuming you pass the user ID in the URL
    // Check if favourites for the user with the given ID exists
    const checkUserSql = "SELECT COUNT(*) AS userCount FROM favourites WHERE id = ?";
    db_1.default.query(checkUserSql, [userId], (err, userResults) => {
        if (err) {
            console.error("Error checking favourites:", err);
            return res.status(500).json({ success: false, message: err === null || err === void 0 ? void 0 : err.message });
        }
        const userCount = userResults[0].userCount;
        // If favourites doesn't exist, send an error response
        if (userCount === 0) {
            return res
                .status(404)
                .json({ success: false, message: "favourites not found" });
        }
        // If favourites exists, proceed with the deletion
        const deleteSql = "DELETE FROM favourites WHERE id = ?";
        db_1.default.query(deleteSql, [userId], (err, results) => {
            if (err) {
                console.error("Error deleting favourites:", err);
                res
                    .status(500)
                    .json({ success: false, message: "Internal Server Error" });
            }
            else {
                res
                    .status(200)
                    .json({ success: true, message: "favourites deleted successfully" });
            }
        });
    });
};
exports.FavouritesController = {
    getSingleFavourites,
    createFavourites,
    updateFavourites,
    deleteFavourites,
    getFavouritesByUserId,
    getFavouritesCountByBioId,
    getFavouritesListByUserId,
    getFavouritesByWhoByUserId,
};
