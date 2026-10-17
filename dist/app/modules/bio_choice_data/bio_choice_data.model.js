"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const BioChoiceSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    bio_user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    bio_details: { type: String, required: true },
    feedback: { type: String, required: false },
    bio_input: { type: String, required: false },
    status: {
        type: String,
        required: false,
        default: "pending",
        // TODO: "accepted" from old clients is converted to "approved" before saving.
        enum: ["pending", "rejected", "approved"],
    },
    // TODO: reminder emails the sender has sent the biodata owner about this pending proposal.
    reminder_emails_sent: { type: Number, default: 0, min: 0 },
    last_reminder_at: { type: Date, required: false },
}, {
    timestamps: true,
});
const BioChoice = (0, mongoose_1.model)("BioChoice", BioChoiceSchema);
exports.default = BioChoice;
