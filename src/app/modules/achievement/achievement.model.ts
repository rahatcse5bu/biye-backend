import mongoose, { Schema } from "mongoose";
import { IAchievement } from "./achievement.interface";

const AchievementItemSchema = new Schema(
  {
    title: { type: String, required: true },
    year: { type: String, required: false },
    description: { type: String, required: false },
  },
  { _id: false }
);

const AchievementSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    achievements: { type: [AchievementItemSchema], default: [] },
  },
  { timestamps: true }
);

const Achievement = mongoose.model<IAchievement>("Achievement", AchievementSchema);

export default Achievement;
