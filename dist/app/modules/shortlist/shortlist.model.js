"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const shortlistSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    bio_user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, {
    timestamps: true,
});
// Compound index to prevent duplicates
shortlistSchema.index({ user: 1, bio_user: 1 }, { unique: true });
const Shortlist = (0, mongoose_1.model)("Shortlist", shortlistSchema);
exports.default = Shortlist;
