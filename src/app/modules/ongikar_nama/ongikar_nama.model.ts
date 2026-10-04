import mongoose, { Schema, Document } from "mongoose";
import { IOngikarNama } from "./ongikar_nama.interface";

// Step 2: Create the Mongoose Schema and Model
const OngikarNamaSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },

    is_family_know: { type: String, required: true },
    isTrueData: { type: String, required: true },
    isAgree: { type: String, required: true },
    request_practicing_status: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);

const OngikarNama = mongoose.model<IOngikarNama>(
  "OngikarNama",
  OngikarNamaSchema
);

export default OngikarNama;
