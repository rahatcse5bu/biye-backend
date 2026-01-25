import { Schema, model } from "mongoose";
import { IReaction } from "./reactions.interface";

const reactionSchema = new Schema<IReaction>(
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
    reaction_type: {
      type: String,
      enum: ['like', 'dislike', 'love', 'sad', 'angry', 'wow'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure user can only have one reaction per biodata
reactionSchema.index({ user: 1, bio_user: 1 }, { unique: true });

const Reaction = model<IReaction>("Reaction", reactionSchema);

export default Reaction;
