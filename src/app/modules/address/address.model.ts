import mongoose, { Model, Schema } from "mongoose";
import { IAddress } from "./address.interface";

// Define Address Schema
const addressSchema: Schema<IAddress> = new Schema<IAddress>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    permanent_address: { type: String, required: true },
    present_address: { type: String, required: true },
    grown_up: { type: String, required: true },
    present_area: { type: String, required: true },
    permanent_area: { type: String, required: true },
    zilla: { type: String, required: true },
    upzilla: { type: String, required: true },
    division: { type: String, required: true },
    city: { type: String, required: true },
    zip: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

// Create Address model
const Address: Model<IAddress> = mongoose.model<IAddress>(
  "Address",
  addressSchema
);

export default Address;
