import { model, Schema, Document, Types } from "mongoose";
import { IBioChoiceDocument } from "./bio_choice_data.interface";

const BioChoiceSchema: Schema<IBioChoiceDocument> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bio_user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bio_details: { type: String, required: true },
    feedback: { type: String, required: false },
    status: {
      type: String,
      required: false,
      default: "pending",
      enum: ["pending", "accepted", "rejected", "approved"],
    },
  },
  {
    timestamps: true,
  }
);

const BioChoice = model<IBioChoiceDocument>("BioChoice", BioChoiceSchema);

export default BioChoice;
