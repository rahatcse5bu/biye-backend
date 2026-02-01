// src/models/GeneralInfo.ts
import mongoose, { Document, Schema } from "mongoose";
import { IGeneralInfo } from "./general_info.interface";

interface GeneralInfoDocument extends IGeneralInfo, Document {}

const GeneralInfoSchema: Schema<GeneralInfoDocument> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    refer_user: { type: Schema.Types.ObjectId, ref: "User", required: false },
    bio_type: { type: String, required: true },
    isMarriageDone: { type: Boolean, default: false },
    date_of_birth: { type: Date, required: true },
    height: { type: Number, required: true },
    gender: { type: String, required: true },
    weight: { type: Number, required: true },
    blood_group: { type: String, required: true },
    screen_color: { type: String, required: true },
    nationality: { type: String, required: true },
    marital_status: { type: String, required: true },
    religion: { type: String, required: false, default: "islam", enum: ["islam", "hinduism", "christianity"] },
    religious_type: { type: String, required: false, enum: ["practicing_muslim", "general_muslim", "practicing_hindu", "general_hindu", "practicing_christian", "general_christian"] },
    request_practicing_status: { type: Boolean, required: false, default: false },
    views_count: { type: Number, default: 0 },
    likes_count: { type: Number, default: 0 },
    dislikes_count: { type: Number, default: 0 },
    purchases_count: { type: Number, default: 0 },
    isFbPosted: { type: Boolean, default: false, required: false },
    isFeatured: { type: Boolean, required: false, default: false },
    zilla: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);

const GeneralInfo = mongoose.model<GeneralInfoDocument>(
  "GeneralInfo",
  GeneralInfoSchema
);

export default GeneralInfo;
