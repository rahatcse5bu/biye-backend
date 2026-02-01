import { Schema } from "mongoose";

export interface IPersonalInfo {
  user: Schema.Types.ObjectId;
  
  // Common Fields
  physical_problem?: string;
  about_me?: string;
  my_phone?: string;
  my_categories?: string[];
  
  // Islamic Fields
  outside_clothings?: string;
  isBeard?: string;
  from_beard?: string;
  isTakhnu?: string;
  isDailyFive?: string;
  isDailyFiveJamaat?: string;
  daily_five_jamaat_from?: string;
  daily_five_from?: string;
  qadha_weekly?: string;
  mahram_non_mahram?: string;
  quran_tilawat?: string;
  fiqh?: string;
  natok_cinema?: string;
  special_deeni_mehnot?: string;
  mazar?: string;
  islamic_books?: string;
  islamic_scholars?: string;
  isNeshaDrobbo?: string;
  from_when_nikhab?: string;
  about_reverted_islam?: string;
  about_milad_qiyam?: string;
  
  // Hindu Fields
  sampraday?: string;
  sub_sampraday?: string;
  caste?: string;
  sub_caste?: string;
  gotra?: string;
  belief_in_god?: string;
  religious_practice_level?: string;
  regular_pooja?: string;
  vrat_observance?: string;
  temple_visit_frequency?: string;
  ishta_devata?: string;
  kul_devata?: string;
  spiritual_guide?: string;
  food_habit?: string;
  alcohol_consumption?: string;
  smoking?: string;
  marriage_view?: string;
  vedic_marriage_interest?: string;
  kundali_matching_belief?: string;
  birth_time?: string;
  rashi?: string;
  mangalik_status?: string;
  partner_religious_expectation?: string;
  religious_flexibility?: string;
  
  // Christian Fields
  denomination?: string;
  church_name?: string;
  bible_reading_frequency?: string;
  church_attendance?: string;
  church_activity_participation?: string;
  baptism_status?: string;
  confirmation_status?: string;
  religious_value_importance?: string;
  follows_christian_ethics?: string;
  church_wedding_preference?: string;
  christian_partner_preference?: string;
  children_religious_education?: string;
  expects_partner_cooperation?: string;
}
