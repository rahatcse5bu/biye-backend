import { Schema, Types, model } from "mongoose";

// TODO: points a member pays once to see who added their biodata to favourites.
export const LIKERS_VIEW_POINTS = 50;

export interface ILikersAccess {
  user: Types.ObjectId;
  points_spent: number;
  createdAt: Date;
}

// TODO: one row per member who unlocked the list; unique so a double click can't charge twice.
const likersAccessSchema = new Schema<ILikersAccess>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    points_spent: { type: Number, required: true },
  },
  { timestamps: true },
);

const LikersAccess = model<ILikersAccess>("LikersAccess", likersAccessSchema);

export default LikersAccess;
