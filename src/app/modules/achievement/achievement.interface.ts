import { Schema, Document } from "mongoose";

export interface IAchievementItem {
  title: string;
  year?: string;
  description?: string;
}

export interface IAchievement extends Document {
  user: Schema.Types.ObjectId;
  achievements: IAchievementItem[];
}
