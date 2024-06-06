import { Schema, Document } from "mongoose";

// Step 1: Define TypeScript Interface
export interface IMaritalInfo extends Document {
  user: Schema.Types.ObjectId;
  isFamilyAgree?: string;
  isPordaToWife?: string;
  permission_for_study?: string;
  permission_for_job?: string;
  isJoutuk?: string;
  after_marriage_where?: string;
  divorced_reason?: string;
  why_marriage?: string;
  wife_dead_info?: string;
  when_husband_dead?: string;
  why_married_another?: string;
  is_running_job?: string;
  is_running_study?: string;
  after_marriage_running_job?: string;
  quantity_wife_and_children?: string;
}
