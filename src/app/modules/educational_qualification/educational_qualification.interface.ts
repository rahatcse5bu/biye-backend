import { Document, Schema } from "mongoose";

// Define an interface representing a document in MongoDB.
export interface IEducationalQualification extends Document {
  user: Schema.Types.ObjectId;
  education_medium?: string; // Optional string for education medium
  highest_edu_level: string; // Required string for highest education level
  others_edu?: string; // Optional string for other education details

  // Secondary School Certificate (SSC) Information
  before_ssc?: string; // Optional string for details before SSC
  deeni_edu?: string; // Optional string for religious education details
  ssc_year?: number; // Optional number for SSC year
  ssc_group?: string; // Optional string for SSC group
  ssc_result?: string; // Optional string for SSC result

  // After SSC Information
  after_ssc_running?: boolean; // Boolean indicating if studying after SSC
  after_ssc_result?: string; // Optional string for after SSC result
  after_ssc_group?: string; // Optional string for after SSC group
  after_ssc_year?: number; // Optional number for after SSC year

  // Diploma Information
  diploma_running_year?: number; // Optional number for diploma running year
  diploma_sub?: string; // Optional string for diploma subject
  diploma_inst?: string; // Optional string for diploma institution
  diploma_pass_year?: number; // Optional number for diploma passing year

  // Honors Information
  hons_inst?: string; // Optional string for Honors institution
  hons_year?: number; // Optional number for Honors year
  hons_sub?: string; // Optional string for Honors subject
  after_ssc_medium?: string; // Optional string for medium after SSC
  hons_pass_year?: number; // Optional number for Honors passing year

  // Masters (MSc) Information
  msc_sub?: string; // Optional string for MSc subject
  msc_pass_year?: number; // Optional number for MSc passing year
  msc_inst?: string; // Optional string for MSc institution

  // PhD Information
  phd_pass_year?: number; // Optional number for PhD passing year
  phd_inst?: string; // Optional string for PhD institution
  phd_sub?: string; // Optional string for PhD subject

  // Additional Qualifications
  ibti_result?: string; // Optional string for Ibtidai result
  ibti_pass_year?: number; // Optional number for Ibtidai passing year
  ibti_inst?: string; // Optional string for Ibtidai institution

  mutawas_inst?: string; // Optional string for Mutawassiqah institution
  mutawas_pass_year?: number; // Optional number for Mutawassiqah passing year
  mutawas_result?: string; // Optional string for Mutawassiqah result

  sanabiya_inst?: string; // Optional string for Sanad Sanabiyah institution
  sanabiya_result?: string; // Optional string for Sanad Sanabiyah result
  sanabiya_pass_year?: number; // Optional number for Sanad Sanabiyah passing year

  fozilat_inst?: string; // Optional string for Fazilat Ul Qur'an institution
  fozilat_result?: string; // Optional string for Fazilat Ul Qur'an result
  fozilat_pass_year?: number; // Optional number for Fazilat Ul Qur'an passing year

  takmil_inst?: string; // Optional string for Takmil Ul Qur'an institution
  takmil_result?: string; // Optional string for Takmil Ul Qur'an result
  takmil_pass_year?: number; // Optional number for Takmil Ul Qur'an passing year

  takhassus_inst?: string; // Optional string for Takhassus institution
  takhassus_result?: string; // Optional string for Takhassus result
  takhassus_sub?: string; // Optional string for Takhassus subject
  takhassus_pass_year?: number; // Optional number for Takhassus passing year
  status?: string; // Optional string for education status
}
