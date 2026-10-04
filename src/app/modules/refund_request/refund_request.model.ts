import mongoose, { Document, Schema, Types } from "mongoose";

export type RefundRequestStatus = "requested" | "refunded" | "rejected";

export interface IRefundRequest extends Document {
  payment: Types.ObjectId;
  user: Types.ObjectId;
  email: string;
  transaction_id: string;
  paid_amount: number;
  refund_amount: number;
  points_held: number;
  reason: string;
  status: RefundRequestStatus;
  admin_note?: string;
  refund_trx_id?: string;
  processed_at?: Date;
  createdAt: Date;
}

const RefundRequestSchema = new Schema<IRefundRequest>(
  {
    // TODO: unique so each payment can be requested only once.
    payment: { type: Schema.Types.ObjectId, ref: "Payment", required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    email: { type: String, required: true },
    transaction_id: { type: String, required: true },
    paid_amount: { type: Number, required: true },
    refund_amount: { type: Number, required: true, min: 1 },
    points_held: { type: Number, required: true, min: 0 },
    reason: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["requested", "refunded", "rejected"],
      default: "requested",
      index: true,
    },
    admin_note: { type: String, trim: true },
    refund_trx_id: { type: String },
    processed_at: { type: Date },
  },
  { timestamps: true },
);

const RefundRequest = mongoose.model<IRefundRequest>(
  "RefundRequest",
  RefundRequestSchema,
);

export default RefundRequest;
