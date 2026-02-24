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
  religion?: string; // islam, hinduism, christianity
  religious_type?: string; // practicing_muslim, general_muslim, practicing_hindu, general_hindu, practicing_christian, general_christian
  request_practicing_status?: boolean; // User requests to be verified as practicing
  photos?: string[]; // Array of photo URLs (max 5, only for male/bridegroom)
  views_count: number;
  purchases_count: number;
  dislikes_count: number;
  likes_count: number;
  isFbPosted: boolean;
  isFeatured: boolean;
  zilla?: string; // Add this if `zilla` is part of the schema in some cases
}
