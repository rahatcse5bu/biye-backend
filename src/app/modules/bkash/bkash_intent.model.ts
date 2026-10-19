import mongoose, { Schema, Types } from "mongoose";

// TODO: who started each bKash payment, so only that account can confirm it and get its points and notification.
const BkashIntentSchema = new Schema(
  {
    payment_id: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number },
    // TODO: "featured" for featured-biodata payments; empty for points purchases.
    purpose: { type: String },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 7 },
  },
  { versionKey: false },
);

export interface IBkashIntent {
  payment_id: string;
  user: Types.ObjectId;
  amount?: number;
  purpose?: string;
  createdAt: Date;
}

const BkashIntent = mongoose.model<IBkashIntent>("BkashIntent", BkashIntentSchema);

export default BkashIntent;
