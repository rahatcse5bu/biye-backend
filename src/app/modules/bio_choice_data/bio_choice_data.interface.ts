import { Document, Types } from "mongoose";

export interface IBioChoice {
  user: Types.ObjectId; // Reference to a User document
  bio_user: Types.ObjectId; // Reference to a Bio User document
  bio_details: string; // Assuming bio_details is a string (e.g., biography details)
  feedback: string; // Assuming feedback is a string
  status: string; // Assuming status is a string (e.g., 'active', 'inactive')
}

export interface IBioChoiceDocument extends IBioChoice, Document {}
