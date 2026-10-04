import mongoose, { Document, Schema } from "mongoose";

export interface IPointsPackage extends Document {
  name: string;
  price: number;
  points: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

const PointsPackageSchema = new Schema<IPointsPackage>(
  {
    name: { type: String, required: true, trim: true },
    // TODO: unique so a bKash amount maps to exactly one package.
    price: { type: Number, required: true, min: 1, unique: true },
    points: { type: Number, required: true, min: 0 },
    features: { type: [String], default: [] },
    is_active: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const PointsPackage = mongoose.model<IPointsPackage>(
  "PointsPackage",
  PointsPackageSchema,
);

export default PointsPackage;
