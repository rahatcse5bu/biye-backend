import { Document, Types } from "mongoose";

export type FieldType = "text" | "numeric" | "email" | "phone" | "select" | "boolean";

export interface IExtraField {
  label: string;
  value: string | number | boolean;
  fieldType: FieldType;
  options?: string[]; // For select fields only
}

export interface IUnverifiedBiodata extends Document {
  bio_type: string;
  gender: string;
  date_of_birth: Date;
  height: number;
  weight: number;
  blood_group: string;
  screen_color: string;
  nationality: string;
  marital_status: string;
  religion: "islam" | "hinduism" | "christianity";
  religious_type?: string;
  photos: string[];
  zilla: string;
  upzilla: string;
  division: string;
  // Contact info — only revealed after purchase
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  // Extra dynamic fields (label + value pairs shown on detail page)
  extra_fields: IExtraField[];
  // Stats
  views_count: number;
  purchases_count: number;
  is_active: boolean;
  created_by: Types.ObjectId;
  bio_id: number;
}
