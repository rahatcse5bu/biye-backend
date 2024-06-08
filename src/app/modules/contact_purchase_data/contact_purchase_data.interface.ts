import { Schema, Document } from "mongoose";

export interface IContactPurchase extends Document {
  user: Schema.Types.ObjectId;
  bio_user: Schema.Types.ObjectId;
  transaction_id?: string;
}
