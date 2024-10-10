"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserInfoModel = void 0;
// userInfo.model.ts
const mongoose_1 = require("mongoose");
const userInfoSchema = new mongoose_1.Schema({
    user_id: {
        type: Number,
        required: true,
        unique: true,
    },
    user_status: {
        type: String,
        required: false,
        enum: ["pending", "active", "in review", "inactive", "banned"],
        default: "pending",
    },
    email: { type: String, required: true, unique: true },
    user_role: {
        type: String,
        required: false,
        enum: ["admin", "user"],
        default: "user",
    },
    edited_timeline_index: { type: Number, required: false, default: 1 },
    points: { type: Number, required: false, default: 0 },
    last_edited_timeline_index: { type: Number, default: 0 },
    gender: {
        type: String,
    },
    fcmToken: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
});
// userInfoSchema.pre("save", async function (next) {
//   if (!this.isNew) {
//     // Skip for existing documents
//     return next();
//   }
//   const lastUser: any = await this.model("User")
//     .findOne()
//     .sort({ user_id: -1 });
//   this.user_id = lastUser ? lastUser.user_id + 1 : 2000;
//   next();
// });
exports.UserInfoModel = (0, mongoose_1.model)("User", userInfoSchema);
