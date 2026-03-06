import { Schema, Document } from "mongoose";

// Step 1: Define TypeScript Interface
export interface IExpectedPartner extends Document {
  user: Schema.Types.ObjectId;
  age?: {
    min: number;
    max: number;
  };
  color?: string[];
  height?: { min: number; max: number };
  educational_qualifications?: string[];
  zilla?: string[];
  marital_status?: string[];
  occupation?: string[];
  economical_condition?: string[];
  expected_characteristics?: string;
  aqidah_madhab?: string;
  isDivorced_Widow?: string;
  isChild?: string;
  isMasna?: string;
  isStudent?: string;
  expected_income?: number;
  
  // Hindu-specific partner expectations
  partner_caste_preference?: string[];
  partner_sub_caste_preference?: string[];
  partner_gotra_preference?: string;
  partner_sampraday_preference?: string[];
  partner_mangalik_preference?: string;
  
  // Christian-specific partner expectations
  partner_denomination_preference?: string[];
  partner_church_attendance_preference?: string;
}
