import mongoose, { Schema, Document } from "mongoose";
import { IExpectedPartner } from "./expected_lifepartner.interface";

// Step 2: Create the Mongoose Schema and Model
const ExpectedPartnerSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  age: {
    min: {
      type: Number,
      default: 40,
    },
    max: {
      type: Number,
      default: 70,
    },
  },
  color: [],
  height: {
    min: {
      type: Number,
      default: 4,
    },
    max: {
      type: Number,
      default: 6,
    },
  },
  educational_qualifications: [],
  zilla: [],
  marital_status: [],
  occupation: [],
  economical_condition: [],
  expected_characteristics: { type: String, required: false },
  aqidah_madhab: { type: String, required: false },
  isDivorced_Widow: { type: String, required: false },
  isChild: { type: String, required: false },
  isMasna: { type: String, required: false },
  isStudent: { type: String, required: false },
  expected_income: { type: Number, required: false },
  
  // Hindu-specific partner expectations
  partner_caste_preference: [{ type: String }],
  partner_sub_caste_preference: [{ type: String }],
  partner_gotra_preference: { type: String, required: false },
  partner_sampraday_preference: [{ type: String }],
  partner_mangalik_preference: { type: String, required: false },
  
  // Christian-specific partner expectations
  partner_denomination_preference: [{ type: String }],
  partner_church_attendance_preference: { type: String, required: false },
});

const ExpectedPartner = mongoose.model<IExpectedPartner>(
  "ExpectedPartner",
  ExpectedPartnerSchema
);

export default ExpectedPartner;
