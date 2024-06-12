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
    physical_problem: { type: String, required: false },
    special_deeni_mehnot: { type: String, required: false },
    mazar: { type: String, required: false },
    islamic_books: { type: String, required: false },
    islamic_scholars: { type: String, required: false },
    my_categories: [],
    about_me: { type: String, required: false },
    my_phone: { type: String, required: false },
    isNeshaDrobbo: { type: String, required: false },
    from_when_nikhab: { type: String, required: false },
    about_reverted_islam: { type: String, required: false },
    about_milad_qiyam: { type: String, required: false },
  },
  { timestamps: true }
);

const PersonalInfo = model<IPersonalInfoDocument>(
  "PersonalInfo",
  personalInfoSchema
);

export default PersonalInfo;
