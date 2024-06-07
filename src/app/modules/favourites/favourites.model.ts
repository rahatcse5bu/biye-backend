import { Schema, model, Document } from "mongoose";
import { IFavorite } from "./favourites.interface";

const favoriteSchema = new Schema<IFavorite>(
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

const Favorite = model<IFavorite>("Favorite", favoriteSchema);

export default Favorite;
