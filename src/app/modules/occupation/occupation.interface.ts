import { Schema, Document } from "mongoose";

// Interface for Working History Entry
export interface IWorkingHistory {
  company_name: string;
  designation: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  job_description?: string;
}

// Interface for Occupation
export interface IOccupation extends Document {
  user: Schema.Types.ObjectId;
  occupation: [];
  occupation_details: string;
  monthly_income: number;
  working_history?: IWorkingHistory[];
}
