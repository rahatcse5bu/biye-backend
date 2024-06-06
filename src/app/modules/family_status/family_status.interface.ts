import { Schema } from "mongoose";

export interface IFamilyStatus {
  user: Schema.Types.ObjectId; // Reference to the user model
  father_name: string;
  father_occupation: string;
  isFatherAlive: string;
  mother_name: string;
  isMotherAlive: string;
  mother_occupation: string;
  number_of_brothers: string;
  brother_info: string[]; // Array of strings to store information about brothers
  number_of_sisters: string;
  sister_info: string[]; // Array of strings to store information about sisters
  uncle_info: string; // Information about uncles
  family_eco_condition: string; // Economic condition of the family
  eco_condition_type: string; // Type of economic condition
  family_deeni_info: string; // Religious information about the family
}
