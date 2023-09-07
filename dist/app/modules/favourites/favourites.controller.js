"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavouritesController = void 0;
const db_1 = __importDefault(require("../../../config/db"));
const SendSuccess_1 = require("../../../shared/SendSuccess");
const generatePlaceholders_1 = require("../../../utils/generatePlaceholders");
const favourites_constant_1 = require("./favourites.constant");
const getFavourites = (req, res) => {
    const sql = "SELECT * FROM favourites";
    db_1.default.query(sql, (err, rows) => {
        if (err) {
            res.send({
                message: err === null || err === void 0 ? void 0 : err.message,
                success: false,
            });
        }
        res
            .status(200)
            .json((0, SendSuccess_1.sendSuccess)("All favourites  retrieved successfully", rows));
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
    const data = req.body;
    // Insert bio_choice_datarmation into the database
    const insertSql = `INSERT INTO bio_choice_data (
    	${favourites_constant_1.FavouritesFields.join(",")}
  ) VALUES (${(0, generatePlaceholders_1.generatePlaceholders)(favourites_constant_1.FavouritesFields.length)})`;
    const BioChoiceData = [];
    favourites_constant_1.FavouritesFields.forEach((field) => {
        BioChoiceData.push(data[field]);
    });
    db_1.default.query(insertSql, BioChoiceData, (err, results) => {
        if (err) {
            console.error("Error inserting favourites:", err);
            res
                .status(500)
                .json({ success: false, message: "Internal Server Error" });
        }
        else {
            res.status(201).json({
                success: true,
                message: "favourites created successfully",
            });
        }
    });
};
const updateFavourites = (req, res) => {
    const data = req.body;
    const userId = req.params.id; // Assuming you pass the user ID in the URL
    console.log(data);
    // Begin a database transaction
    db_1.default.beginTransaction((err) => {
        if (err) {
            console.error("Error starting transaction:", err);
            return res
                .status(500)
                .json({ success: false, message: "Internal Server Error" });
        }
        // Check if favourites for the user with the given ID exists
        const checkUserSql = "SELECT * FROM favourites WHERE id = ?";
        db_1.default.query(checkUserSql, [userId], (err, userResults) => {
            if (err) {
                console.error("Error checking favourites:", err);
                db_1.default.rollback(() => {
                    res.status(500).json({ success: false, message: err === null || err === void 0 ? void 0 : err.message });
                });
                return;
            }
            const userCount = userResults.length;
            // If favourites doesn't exist, send an error response
            if (userCount === 0) {
                db_1.default.rollback(() => {
                    res
                        .status(404)
                        .json({ success: false, message: "favourites not found" });
                });
                return;
            }
            const currentUserData = userResults[0];
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
            const updateSql = `UPDATE favourites SET ${updateFields.join(", ")} WHERE id = ?`;
            updateValues.push(userId);
            // Execute the update query within the transaction
            db_1.default.query(updateSql, updateValues, (err, results) => {
                if (err) {
                    console.error("Error updating favourites:", err);
                    db_1.default.rollback(() => {
                        res
                            .status(500)
                            .json({ success: false, message: "Internal Server Error" });
                    });
                }
                else {
                    // Commit the transaction if the update was successful
                    db_1.default.commit(() => {
                        res
                            .status(200)
                            .json((0, SendSuccess_1.sendSuccess)("Update sucessfully completed", results, 200));
                    });
                }
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
    getFavourites,
    getSingleFavourites,
    createFavourites,
    updateFavourites,
    deleteFavourites,
};
