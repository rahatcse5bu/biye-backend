import { Schema, model, Document } from "mongoose";
import { IPersonalInfo } from "./personal_info.interface";

// Create a new interface that extends Document and IPersonalInfo
interface IPersonalInfoDocument extends IPersonalInfo, Document {}

const personalInfoSchema: Schema<IPersonalInfoDocument> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Common Fields
    physical_problem: { type: String, required: false },
    about_me: { type: String, required: false },
    my_phone: { type: String, required: false },
    my_categories: { type: [String], default: [] },
    
    // Islamic Fields
    outside_clothings: { type: String, required: false },
    isBeard: { type: String, required: false },
    from_beard: { type: String, required: false },
    isTakhnu: { type: String, required: false },
    isDailyFive: { type: String, required: false },
    isDailyFiveJamaat: { type: String, required: false },
    daily_five_jamaat_from: { type: String, required: false },
    daily_five_from: { type: String, required: false },
    qadha_weekly: { type: String, required: false },
    mahram_non_mahram: { type: String, required: false },
    quran_tilawat: { type: String, required: false },
    fiqh: { type: String, required: false },
    natok_cinema: { type: String, required: false },
    special_deeni_mehnot: { type: String, required: false },
    mazar: { type: String, required: false },
    islamic_books: { type: String, required: false },
    islamic_scholars: { type: String, required: false },
    isNeshaDrobbo: { type: String, required: false },
    from_when_nikhab: { type: String, required: false },
    about_reverted_islam: { type: String, required: false },
    about_milad_qiyam: { type: String, required: false },
    
    // Hindu Fields
    sampraday: { type: String, required: false },
    sub_sampraday: { type: String, required: false },
    caste: { type: String, required: false },
    sub_caste: { type: String, required: false },
    gotra: { type: String, required: false },
    belief_in_god: { type: String, required: false },
    religious_practice_level: { type: String, required: false },
    regular_pooja: { type: String, required: false },
    vrat_observance: { type: String, required: false },
    temple_visit_frequency: { type: String, required: false },
    ishta_devata: { type: String, required: false },
    kul_devata: { type: String, required: false },
    spiritual_guide: { type: String, required: false },
    food_habit: { type: String, required: false },
    alcohol_consumption: { type: String, required: false },
    smoking: { type: String, required: false },
    marriage_view: { type: String, required: false },
    vedic_marriage_interest: { type: String, required: false },
    kundali_matching_belief: { type: String, required: false },
    birth_time: { type: String, required: false },
    rashi: { type: String, required: false },
    mangalik_status: { type: String, required: false },
    partner_religious_expectation: { type: String, required: false },
    religious_flexibility: { type: String, required: false },
    
    // Christian Fields
    denomination: { type: String, required: false },
    church_name: { type: String, required: false },
    bible_reading_frequency: { type: String, required: false },
    church_attendance: { type: String, required: false },
    church_activity_participation: { type: String, required: false },
    baptism_status: { type: String, required: false },
    confirmation_status: { type: String, required: false },
    religious_value_importance: { type: String, required: false },
    follows_christian_ethics: { type: String, required: false },
    church_wedding_preference: { type: String, required: false },
    christian_partner_preference: { type: String, required: false },
    children_religious_education: { type: String, required: false },
    expects_partner_cooperation: { type: String, required: false },
  },
  { timestamps: true }
);

const PersonalInfo = model<IPersonalInfoDocument>(
  "PersonalInfo",
  personalInfoSchema
);

export default PersonalInfo;
