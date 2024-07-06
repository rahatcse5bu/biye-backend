import mongoose, { Schema } from "mongoose";
import { IPayment } from "./payments.interface";

const paymentSchema: Schema = new Schema(
  {
    payment_id: { type: String, required: false },
    transaction_id: { type: String, required: false },
    method: { type: String, required: false },
    email: { type: String, required: true },
    amount: { type: Number, required: false },
    status: {
      type: String,
      enum: ["Completed", "Pending", "Refunded"],
      default: "Pending",
    },
    points: {
      type: Number,
      default: 0,
    },
    // bio_id: { type: Schema.Types.ObjectId, ref: "Bio", required: true },
    trnx_time: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model<IPayment>("Payment", paymentSchema);

export default Payment;
