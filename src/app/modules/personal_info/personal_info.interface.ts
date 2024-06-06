import { Schema } from "mongoose";

export interface IPersonalInfo {
  user: Schema.Types.ObjectId;
  outside_clothings: string;
  isBeard: string;
  from_beard: string;
  isTakhnu: string;
  isDailyFive: string;
  isDailyFiveJamaat: string;
  daily_five_jamaat_from: string;
  daily_five_from: string;
  qadha_weekly: string;
  mahram_non_mahram: string;
  quran_tilawat: string;
  fiqh: string;
  natok_cinema: string;
  physical_problem: string;
  special_deeni_mehnot: string;
  mazar: string;
  islamic_books: string;
  islamic_scholars: string;
  my_categories: string;
  about_me: string;
  my_phone: string;
  isNeshaDrobbo: string;
  from_when_nikhab: string;
  about_reverted_islam: string;
  about_milad_qiyam: string;
}
