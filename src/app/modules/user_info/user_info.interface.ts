// userInfo.interface.ts
import { Document } from "mongoose";

export interface IUserInfo extends Document {
  token_id: string;
  user_id: number;
  user_status: string;
  email: string;
  google_id?: string;
  password_hash?: string;
  username?: string;
  picture?: string;
  preferred_religion?: "islam" | "hinduism" | "christianity" | "all" | null;
  user_role: string;
  edited_timeline_index: number;
  points: number;
  last_edited_timeline_index: number;
  gender?: string;
}
