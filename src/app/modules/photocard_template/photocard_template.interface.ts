import { Document } from "mongoose";

export type BioType = "supply" | "demand";

export interface IPhotocardTemplate extends Document {
    name: string;                    // e.g., "Modern Green", "Cherry Blossom"
    description?: string;             // Template description
    svgCode: string;                  // Full SVG template code
    isBuiltIn: boolean;               // True for default templates
    bioType: BioType;                 // Which bio type uses this
    isActive: boolean;                // Can be disabled
    placeholders: string[];           // Dynamic placeholders like {name}, {age}, etc
    createdBy?: string;               // Admin who created it
    updatedAt: Date;
    createdAt: Date;
}

export interface ITemplateData {
    name?: string;
    age?: number;
    height?: string;
    weight?: string;
    religion?: string;
    location?: string;
    gender?: string;
    bio_type?: string;
    complexion?: string;
    profession?: string;
    [key: string]: any; // Allow dynamic fields
}
