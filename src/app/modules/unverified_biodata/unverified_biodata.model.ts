import mongoose, { Schema } from "mongoose";
import { IUnverifiedBiodata } from "./unverified_biodata.interface";

let counter = 0;

const UnverifiedBiodataSchema: Schema<IUnverifiedBiodata> = new Schema(
  {
    bio_type: { type: String, required: true },
    gender: { type: String, required: true },
    date_of_birth: { type: Date, required: true },
    height: { type: Number, required: true },
    weight: { type: Number, required: true },
    blood_group: { type: String, required: true },
    screen_color: { type: String, required: true },
    nationality: { type: String, required: true, default: "বাংলাদেশী" },
    marital_status: { type: String, required: true },
    religion: {
      type: String,
      required: true,
      default: "islam",
      enum: ["islam", "hinduism", "christianity"],
    },
    religious_type: { type: String, required: false },
    photos: {
      type: [String],
      default: [],
      validate: [(v: string[]) => v.length <= 5, "Maximum 5 photos allowed"],
    },
    zilla: { type: String, required: true },
    upzilla: { type: String, required: false, default: "" },
    division: { type: String, required: false, default: "" },
    extra_fields: {
      type: [
        {
          label: { type: String, required: true },
          value: { type: Schema.Types.Mixed, required: true },
          fieldType: { type: String, required: true, enum: ["section", "text", "multi-line", "numeric", "email", "phone", "select", "boolean"] },
          options: { type: [String], default: [] },
        },
      ],
      default: [],
    },
    contact_name: { type: String, required: false, default: "" },
    contact_phone: { type: String, required: false, default: "" },
    contact_email: { type: String, required: false, default: "" },
    views_count: { type: Number, default: 0 },
    purchases_count: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
    created_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bio_id: { type: Number, unique: true },
  },
  { timestamps: true }
);

// Auto-generate a unique bio_id using timestamp + counter
UnverifiedBiodataSchema.pre("save", function (next) {
  if (!this.bio_id) {
    counter = (counter + 1) % 10000;
    this.bio_id = Date.now() * 10000 + counter;
  }
  next();
});

const UnverifiedBiodata = mongoose.model<IUnverifiedBiodata>(
  "UnverifiedBiodata",
  UnverifiedBiodataSchema
);

export default UnverifiedBiodata;
