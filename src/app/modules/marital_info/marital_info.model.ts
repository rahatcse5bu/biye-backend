import mongoose, { Schema } from "mongoose";
import { IMaritalInfo } from "./marital_info.interface";

const MaritalInfoSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  isFamilyAgree: { type: String, required: false },
  isPordaToWife: { type: String, required: false },
  permission_for_study: { type: String, required: false },
  permission_for_job: { type: String, required: false },
  isJoutuk: { type: String, required: false },
  after_marriage_where: { type: String, required: false },
  divorced_reason: { type: String, required: false },
  why_marriage: { type: String, required: false },
  wife_dead_info: { type: String, required: false },
  when_husband_dead: { type: String, required: false },
  why_married_another: { type: String, required: false },
  is_running_job: { type: String, required: false },
  is_running_study: { type: String, required: false },
  after_marriage_running_job: { type: String, required: false },
  quantity_wife_and_children: { type: String, required: false },
});

const MaritalInfo = mongoose.model<IMaritalInfo>(
  "MaritalInfo",
  MaritalInfoSchema
);

export default MaritalInfo;
