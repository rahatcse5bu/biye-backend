import { Schema, Document } from "mongoose";

// Interface for Occupation
export interface IOccupation extends Document {
  user: Schema.Types.ObjectId;
  occupation: string;
  occupation_details: string;
  monthly_income: number;
}
