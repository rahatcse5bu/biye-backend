import mongoose, { Schema } from "mongoose";
import { IOccupation } from "./occupation.interface";

// Mongoose schema for Occupation
const OccupationSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    occupation: [],
    occupation_details: { type: String, required: true },
    monthly_income: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

// Export the Occupation model
const Occupation = mongoose.model<IOccupation>("Occupation", OccupationSchema);

export default Occupation;
