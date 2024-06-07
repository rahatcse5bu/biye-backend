import { Schema, model, Document } from "mongoose";
import { IUnFavorite } from "./unfavorites.interface";

const unFavoriteSchema = new Schema<IUnFavorite>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bio_user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const UnFavorite = model<IUnFavorite>("UnFavorite", unFavoriteSchema);

export default UnFavorite;
