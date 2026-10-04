import mongoose, { Document, Schema } from "mongoose";

export interface ICustomPointsSettings extends Document {
  key: string;
  enabled: boolean;
  points_per_taka: number;
  min_amount: number;
  max_amount: number;
}

// TODO: single document (key "default") holding the custom-amount purchase rules.
const CustomPointsSettingsSchema = new Schema<ICustomPointsSettings>(
  {
    key: { type: String, default: "default", unique: true },
    enabled: { type: Boolean, default: true },
    points_per_taka: { type: Number, default: 1.2, min: 0 },
    min_amount: { type: Number, default: 10, min: 1 },
    max_amount: { type: Number, default: 10000, min: 1 },
  },
  { timestamps: true },
);

const CustomPointsSettings = mongoose.model<ICustomPointsSettings>(
  "CustomPointsSettings",
  CustomPointsSettingsSchema,
);

export default CustomPointsSettings;
