"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModel = void 0;
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
    recipient: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    audience: {
        type: String,
        enum: ["user", "admin"],
        required: true,
    },
    type: {
        type: String,
        enum: ["biodata", "payment", "refund", "moderation", "system"],
        required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link: { type: String, trim: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
}, { timestamps: true });
notificationSchema.index({ recipient: 1, audience: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ audience: 1, isRead: 1, createdAt: -1 });
exports.NotificationModel = (0, mongoose_1.model)("Notification", notificationSchema);
