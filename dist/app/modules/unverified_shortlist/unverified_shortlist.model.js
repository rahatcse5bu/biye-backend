"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    unverified_bio: { type: mongoose_1.Schema.Types.ObjectId, ref: "UnverifiedBiodata", required: true },
}, { timestamps: true });
schema.index({ user: 1, unverified_bio: 1 }, { unique: true });
exports.default = (0, mongoose_1.model)("UnverifiedShortlist", schema);
