import { Schema, Document } from "mongoose";
import { IUserInfo } from "../user_info/user_info.interface";

// Step 1: Define TypeScript Interface
export interface IContact extends Document {
  user: Schema.Types.ObjectId | IUserInfo;
  full_name: string;
  family_number: string;
  relation: string;
  bio_receiving_email: string;
}
