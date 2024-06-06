import { Document, Schema } from "mongoose";
import { IUserInfo } from "../user_info/user_info.interface";

// Define type for Address document
export type IAddress = Document & {
  user: Schema.Types.ObjectId | IUserInfo;
  user_id: number;
  permanent_address: string;
  present_address: string;
  permanent_area: string;
  present_area: string;
  grown_up: string;
  zilla: string;
  upzilla: string;
  division: string;
  city: string;
  zip: number;
  user_form?: string;
};
