import mongoose, { Schema } from "mongoose";
import { IPhotocardTemplate } from "./photocard_template.interface";

const PhotocardTemplateSchema: Schema<IPhotocardTemplate> = new Schema(
    {
        name: { type: String, required: true, unique: true },
        description: { type: String, default: "" },
        svgCode: { type: String, required: true },
        isBuiltIn: { type: Boolean, default: false },
        bioType: { type: String, required: true, enum: ["supply", "demand"] },
        isActive: { type: Boolean, default: true },
        placeholders: { type: [String], default: [] },
        createdBy: { type: String, default: "system" },
    },
    { timestamps: true }
);

export const PhotocardTemplate = mongoose.model<IPhotocardTemplate>(
    "PhotocardTemplate",
    PhotocardTemplateSchema
);
