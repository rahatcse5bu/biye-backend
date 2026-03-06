import mongoose, { Schema } from "mongoose";
import { IOccupation } from "./occupation.interface";

// Working History Sub-schema
const WorkingHistorySchema = new Schema(
  {
    company_name: { type: String, required: true },
    designation: { type: String, required: true },
    start_date: { type: String, required: false },
    end_date: { type: String, required: false },
    is_current: { type: Boolean, default: false },
    job_description: { type: String, required: false },
  },
  { _id: false }
);

// Mongoose schema for Occupation
const OccupationSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    occupation: [],
    occupation_details: { type: String, required: true },
    monthly_income: { type: Number, required: true },
    working_history: { type: [WorkingHistorySchema], default: [] },
  },
  {
    timestamps: true,
  }
);

// Export the Occupation model
const Occupation = mongoose.model<IOccupation>("Occupation", OccupationSchema);

export default Occupation;
