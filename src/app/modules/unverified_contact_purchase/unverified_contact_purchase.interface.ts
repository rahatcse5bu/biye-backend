import { Schema, Document } from "mongoose";

export interface IUnverifiedContactPurchase extends Document {
  user: Schema.Types.ObjectId;
  unverified_biodata: Schema.Types.ObjectId;
  points_spent: number;
  contact_info: {
    full_name: string;
    family_number: string;
    bio_receiving_email: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}
