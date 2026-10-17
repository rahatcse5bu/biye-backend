"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountsEntry = void 0;
const mongoose_1 = require("mongoose");
const accountsEntrySchema = new mongoose_1.Schema({
    type: { type: String, enum: ["expense", "income", "investment"], required: true },
    amountPaisa: { type: Number, required: true, min: 1, max: 99999999999, validate: Number.isSafeInteger },
    date: { type: String, required: true },
    category: { type: String, required: true, trim: true, maxlength: 100 },
    person: { type: String, trim: true, maxlength: 150, default: "" },
    notes: { type: String, trim: true, maxlength: 1000, default: "" },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
accountsEntrySchema.index({ date: -1, _id: -1 });
exports.AccountsEntry = (0, mongoose_1.model)("AccountsEntry", accountsEntrySchema);
