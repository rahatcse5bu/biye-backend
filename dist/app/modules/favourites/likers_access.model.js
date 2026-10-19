"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIKERS_VIEW_POINTS = void 0;
const mongoose_1 = require("mongoose");
// TODO: points a member pays once to see who added their biodata to favourites.
exports.LIKERS_VIEW_POINTS = 50;
// TODO: one row per member who unlocked the list; unique so a double click can't charge twice.
const likersAccessSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    points_spent: { type: Number, required: true },
}, { timestamps: true });
const LikersAccess = (0, mongoose_1.model)("LikersAccess", likersAccessSchema);
exports.default = LikersAccess;
