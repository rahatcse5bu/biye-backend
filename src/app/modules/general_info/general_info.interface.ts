import { IUserInfo } from "./../user_info/user_info.interface";
import { Schema } from "mongoose";

// src/interfaces/GeneralInfo.ts
export interface IGeneralInfo {
  user: Schema.Types.ObjectId | IUserInfo;
  refer_user: Schema.Types.ObjectId | IUserInfo;
  bio_type: string;
  isMarriageDone: boolean;
  date_of_birth: Date;
  height: number;
  gender: string;
  weight: number;
  blood_group: string;
  screen_color: string;
  nationality: string;
  marital_status: string;
  views_count: number;
  purchases_count: number;
  dislikes_count: number;
  likes_count: number;
  isFbPosted: boolean;
  isFeatured: boolean;
  zilla?: string; // Add this if `zilla` is part of the schema in some cases
}
