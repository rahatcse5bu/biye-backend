import { Schema, Document } from "mongoose";

export interface IFavorite extends Document {
  user: Schema.Types.ObjectId;
  bio_user: Schema.Types.ObjectId;
}
