import { Schema, Document } from "mongoose";

export type ReactionType = 'like' | 'dislike' | 'love' | 'sad' | 'angry' | 'wow';

export interface IReaction extends Document {
  user: Schema.Types.ObjectId;
  bio_user: Schema.Types.ObjectId;
  reaction_type: ReactionType;
}
