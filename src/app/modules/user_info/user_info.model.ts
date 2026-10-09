// userInfo.model.ts
import { model, Schema } from "mongoose";
import { IUserInfo } from "./user_info.interface";

const userInfoSchema = new Schema<IUserInfo>(
  {
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
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    google_id: {
      type: String,
      unique: true,
      sparse: true,
    },
    password_hash: {
      type: String,
      select: false,
    },
    // TODO: sha256 of the emailed reset token; the raw token is never stored.
    reset_password_token: { type: String, select: false, index: { sparse: true } },
    reset_password_expires: { type: Date, select: false },
    // TODO: tokens issued before this instant are rejected by auth().
    password_changed_at: { type: Date, select: false },
    username: {
      type: String,
      trim: true,
    },
    picture: {
      type: String,
    },
    // TODO: header religion filter, saved for logged-in users; "all" means no filter.
    preferred_religion: {
      type: String,
      enum: ["islam", "hinduism", "christianity", "all"],
      default: null,
    },
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

  },
  {
    timestamps: true,
  }
);

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

export const UserInfoModel = model<IUserInfo>("User", userInfoSchema);
