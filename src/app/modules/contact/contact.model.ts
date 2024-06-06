import mongoose, { Schema, Document } from "mongoose";
import { IContact } from "./contact.interface";

// Step 2: Create the Mongoose Schema and Model
const ContactSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    full_name: { type: String, required: true },
    family_number: { type: String, required: true },
    relation: { type: String, required: true },
    bio_receiving_email: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Contact = mongoose.model<IContact>("Contact", ContactSchema);

export default Contact;
