import mongoose, { Schema } from "mongoose";
import { IPayment } from "./payments.interface";

const paymentSchema: Schema = new Schema(
  {
    transaction_id: { type: String, required: true },
    method: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Completed", "Pending", "Refunded"],
      default: "Pending",
    },
    bio_id: { type: Schema.Types.ObjectId, ref: "Bio", required: true },
    trnx_time: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model<IPayment>("Payment", paymentSchema);

export default Payment;
