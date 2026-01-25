"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const reactionSchema = new mongoose_1.Schema({
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
    reaction_type: {
        type: String,
        enum: ['like', 'dislike', 'love', 'sad', 'angry', 'wow'],
        required: true,
    },
}, {
    timestamps: true,
});
// Compound index to ensure user can only have one reaction per biodata
reactionSchema.index({ user: 1, bio_user: 1 }, { unique: true });
const Reaction = (0, mongoose_1.model)("Reaction", reactionSchema);
exports.default = Reaction;
