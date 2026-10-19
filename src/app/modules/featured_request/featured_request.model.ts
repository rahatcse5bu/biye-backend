import mongoose, { Document, Schema, Types } from "mongoose";

export type FeaturedStatus = "pending" | "approved" | "rejected";

export interface IFeaturedSettings extends Document {
  key: string;
  enabled: boolean;
  price: number;
  duration_days: number;
}

// TODO: single document (key "default"); the admin sets the price and how long a biodata stays featured.
const FeaturedSettingsSchema = new Schema<IFeaturedSettings>(
  {
    key: { type: String, default: "default", unique: true },
    enabled: { type: Boolean, default: true },
    price: { type: Number, default: 500, min: 1 },
    duration_days: { type: Number, default: 30, min: 1 },
  },
  { timestamps: true },
);

export const FeaturedSettings = mongoose.model<IFeaturedSettings>("FeaturedSettings", FeaturedSettingsSchema);

export interface IFeaturedRequest extends Document {
  user: Types.ObjectId;
  biodata: Types.ObjectId;
  bio_user_id?: number;
  email: string;
  payment_id: string;
  transaction_id?: string;
  amount: number;
  duration_days: number;
  status: FeaturedStatus;
  refunded: boolean;
  admin_note?: string;
  reviewed_at?: Date;
  featured_until?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// TODO: one paid request per bKash payment; admin approves (features the biodata) or rejects (optionally refunds).
const FeaturedRequestSchema = new Schema<IFeaturedRequest>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    biodata: { type: Schema.Types.ObjectId, ref: "GeneralInfo", required: true },
    bio_user_id: { type: Number },
    email: { type: String, required: true },
    payment_id: { type: String, required: true, unique: true },
    transaction_id: { type: String },
    amount: { type: Number, required: true },
    duration_days: { type: Number, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    refunded: { type: Boolean, default: false },
    admin_note: { type: String, default: "" },
    reviewed_at: { type: Date },
    featured_until: { type: Date },
  },
  { timestamps: true },
);

export const FeaturedRequest = mongoose.model<IFeaturedRequest>("FeaturedRequest", FeaturedRequestSchema);
