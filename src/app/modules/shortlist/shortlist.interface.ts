import { Schema, Document } from "mongoose";

export interface IShortlist extends Document {
  user: Schema.Types.ObjectId;
  bio_user: Schema.Types.ObjectId;
}
