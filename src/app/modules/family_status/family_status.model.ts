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
    number_of_brothers: { type: String, required: true },
    brother_info: [{ type: String, required: true }],
    number_of_sisters: { type: String, required: true },
    sister_info: [{ type: String, required: true }],
    uncle_info: { type: String, required: true },
    family_eco_condition: { type: String, required: true },
    eco_condition_type: { type: String, required: true },
    family_deeni_info: { type: String, required: true },
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
