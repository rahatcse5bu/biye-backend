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
    trnx_time: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model<IPayment>("Payment", paymentSchema);

export default Payment;
