import mongoose, { Model, Schema } from "mongoose";
import { IAddress } from "./address.interface";

// Define Address Schema
const addressSchema: Schema<IAddress> = new Schema<IAddress>(
  {
    // TODO: every biodata section is looked up by user, so it needs an index.
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    permanent_address: { type: String, required: true },
    present_address: { type: String, required: true },
    grown_up: { type: String, required: true },
    present_area: { type: String, required: true },
    permanent_area: { type: String, required: true },
    zilla: { type: String, required: true },
    upzilla: { type: String, required: true },
    division: { type: String, required: true },
    present_zilla: { type: String, required: true },
    present_upzilla: { type: String, required: true },
    present_division: { type: String, required: true },
    city: { type: String, required: true },
    zip: { type: Number, required: false, default: 0 },
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
