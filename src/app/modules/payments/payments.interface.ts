import { Schema, Document } from "mongoose";

// Step 1: Define TypeScript Interface
export interface IPayment extends Document {
  transaction_id: string;
  method: string;
  user: Schema.Types.ObjectId;
  amount: number;
  status: string;
  bio_id: Schema.Types.ObjectId;
  trnx_time: Date;
}
