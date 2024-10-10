// userInfo.interface.ts
import { Document } from "mongoose";

export interface IUserInfo extends Document {
  token_id: string;
  user_id: number;
  user_status: string;
  email: string;
  user_role: string;
  edited_timeline_index: number;
  points: number;
  last_edited_timeline_index: number;
  gender?: string;
  fcmToken?: string;
}
