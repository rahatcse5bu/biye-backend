import { Schema, Document } from "mongoose";

// Step 1: Define TypeScript Interface
export interface IOngikarNama extends Document {
  user: Schema.Types.ObjectId;
  is_family_know: string;
  isTrueData: string;
  isAgree: string;
}
