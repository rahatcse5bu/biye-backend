import { Schema, Document } from "mongoose";

export interface IUnFavorite extends Document {
  user: Schema.Types.ObjectId;
  bio_user: Schema.Types.ObjectId;
}
