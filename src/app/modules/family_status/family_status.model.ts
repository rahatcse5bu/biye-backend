// models/userFamilyInfo.model.ts
import mongoose, { Document, Schema } from "mongoose";
import { IFamilyStatus } from "./family_status.interface";

const UserFamilyInfoSchema: Schema = new Schema<IFamilyStatus>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    father_name: { type: String, required: true },
    father_occupation: { type: String, required: true },
    isFatherAlive: { type: String, required: true },
    mother_name: { type: String, required: true },
    isMotherAlive: { type: String, required: true },
    mother_occupation: { type: String, required: true },
    number_of_brothers: { type: String, required: false },
    brother_info: [{ type: String, required: false }],
    number_of_sisters: { type: String, required: false },
    sister_info: [{ type: String, required: false }],
    uncle_info: { type: String, required: false },
    family_eco_condition: { type: String, required: true },
    eco_condition_type: { type: String, required: true },
    family_deeni_info: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);

const FamilyStatus = mongoose.model<IFamilyStatus>(
  "FamilyStatus",
  UserFamilyInfoSchema
);

export default FamilyStatus;
