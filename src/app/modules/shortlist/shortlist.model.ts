import { Schema, model } from "mongoose";
import { IShortlist } from "./shortlist.interface";

const shortlistSchema = new Schema<IShortlist>(
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

// Compound index to prevent duplicates
shortlistSchema.index({ user: 1, bio_user: 1 }, { unique: true });

const Shortlist = model<IShortlist>("Shortlist", shortlistSchema);

export default Shortlist;
