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
  
  // Common fields for all religions
  partner_own_home_type?: string[];     // নিজস্ব বাড়ির ধরণ
  flexibility_areas?: string[];        // কোন বিষয়ে ছাড় দিতে চান?
  partner_father_profession?: string[];  // বাবার পেশা কিরকম চান?
  partner_home_type?: string[];          // জীবনসঙ্গীর বাড়ির ধরণ কেমন চান?
  min_ssc_result?: string[];             // SSC/সমমান এ সর্বনিম্ন ফলাফল
  min_hsc_result?: string[];             // HSC তে সর্বনিম্ন ফলাফল
}
