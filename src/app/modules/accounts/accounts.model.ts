import { model, Schema } from "mongoose";

const accountsEntrySchema = new Schema({
  type: { type: String, enum: ["expense", "income", "investment"], required: true },
  amountPaisa: { type: Number, required: true, min: 1, max: 99999999999, validate: Number.isSafeInteger },
  date: { type: String, required: true },
  category: { type: String, required: true, trim: true, maxlength: 100 },
  person: { type: String, trim: true, maxlength: 150, default: "" },
  notes: { type: String, trim: true, maxlength: 1000, default: "" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

accountsEntrySchema.index({ date: -1, _id: -1 });

export const AccountsEntry = model("AccountsEntry", accountsEntrySchema);
