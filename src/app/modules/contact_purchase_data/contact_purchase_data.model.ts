import mongoose, { Schema, Document, Model } from "mongoose";
import { IContactPurchase } from "./contact_purchase_data.interface";

const ContactPurchaseSchema: Schema<IContactPurchase> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    bio_user: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    transaction_id: { type: String },
  },
  { timestamps: true }
);

const ContactPurchase: Model<IContactPurchase> =
  mongoose.model<IContactPurchase>("ContactPurchase", ContactPurchaseSchema);

export default ContactPurchase;
