import mongoose, { Schema, Model } from "mongoose";
import { IUnverifiedContactPurchase } from "./unverified_contact_purchase.interface";

const UnverifiedContactPurchaseSchema: Schema<IUnverifiedContactPurchase> =
  new Schema(
    {
      user: { type: Schema.Types.ObjectId, required: true, ref: "User" },
      unverified_biodata: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "UnverifiedBiodata",
      },
      points_spent: { type: Number, default: 50 },
      contact_info: {
        full_name: { type: String, required: true },
        family_number: { type: String, required: true },
        bio_receiving_email: { type: String, required: true },
      },
    },
    { timestamps: true }
  );

// Ensure unique purchase per user per biodata
UnverifiedContactPurchaseSchema.index(
  { user: 1, unverified_biodata: 1 },
  { unique: true }
);

const UnverifiedContactPurchase: Model<IUnverifiedContactPurchase> =
  mongoose.model<IUnverifiedContactPurchase>(
    "UnverifiedContactPurchase",
    UnverifiedContactPurchaseSchema
  );

export default UnverifiedContactPurchase;
