import { Model } from "mongoose";
import GeneralInfo from "../general_info/general_info.model";
import Address from "../address/address.model";
import EducationalQualification from "../educational_qualification/educational_qualification.model";
import PersonalInfo from "../personal_info/personal_info.model";
import FamilyStatus from "../family_status/family_status.model";
import Occupation from "../occupation/occupation.model";
import MaritalInfo from "../marital_info/marital_info.model";
import ExpectedPartner from "../expected_lifepartner/expected_lifepartner.model";
import OngikarNama from "../ongikar_nama/ongikar_nama.model";
import Contact from "../contact/contact.model";
import Achievement from "../achievement/achievement.model";

export interface BiodataSection {
  key: string;
  path: string;
  label: string;
  model: Model<any>;
}

// TODO: the biodata form sections whose edits need admin approval once a biodata is published.
export const BIODATA_SECTIONS: BiodataSection[] = [
  { key: "general_info", path: "general-info", label: "সাধারণ তথ্য", model: GeneralInfo },
  { key: "address", path: "address", label: "ঠিকানা", model: Address },
  { key: "educational_qualification", path: "educational-qualification", label: "শিক্ষাগত যোগ্যতা", model: EducationalQualification },
  { key: "family_status", path: "family-status", label: "পারিবারিক তথ্য", model: FamilyStatus },
  { key: "personal_info", path: "personal-info", label: "ব্যক্তিগত তথ্য", model: PersonalInfo },
  { key: "occupation", path: "occupation", label: "পেশাগত তথ্য", model: Occupation },
  { key: "marital_info", path: "marital-info", label: "বিয়ে সংক্রান্ত তথ্য", model: MaritalInfo },
  { key: "expected_life_partner", path: "expected-life-partner", label: "প্রত্যাশিত জীবনসঙ্গী", model: ExpectedPartner },
  { key: "ongikar_nama", path: "ongikar-nama", label: "অঙ্গীকারনামা", model: OngikarNama },
  { key: "contact", path: "contact", label: "যোগাযোগ", model: Contact },
  { key: "achievement", path: "achievement", label: "অর্জন", model: Achievement },
];

export const sectionByKey = (key: string) => BIODATA_SECTIONS.find((section) => section.key === key);

// TODO: bookkeeping, counters and moderation fields; never staged or diffed, whatever the client sends.
export const IGNORED_FIELDS = new Set([
  "_id",
  "__v",
  "id",
  "user",
  "user_id",
  "user_form",
  "createdAt",
  "updatedAt",
  "approved_data",
  "pending_changes",
  "biodata_status",
  "version",
  "admin_note",
  "last_approved_at",
  "last_approved_by",
  "views_count",
  "likes_count",
  "dislikes_count",
  "purchases_count",
  "isFeatured",
  "isFbPosted",
  "has_pending_changes",
]);

// TODO: short Bengali labels for the admin review screen; unknown fields fall back to the raw key.
export const FIELD_LABELS: Record<string, Record<string, string>> = {
  general_info: {
    bio_type: "বায়োডাটার ধরন", gender: "লিঙ্গ", date_of_birth: "জন্ম তারিখ", height: "উচ্চতা", weight: "ওজন",
    blood_group: "রক্তের গ্রুপ", screen_color: "গাত্রবর্ণ", nationality: "জাতীয়তা", marital_status: "বৈবাহিক অবস্থা",
    religion: "ধর্ম", religious_type: "ধর্মীয় অনুশীলন", request_practicing_status: "প্র্যাক্টিসিং স্ট্যাটাস অনুরোধ",
    photos: "ছবি", zilla: "জেলা", isMarriageDone: "বিয়ে সম্পন্ন", refer_user: "রেফারার",
  },
  address: {
    permanent_address: "স্থায়ী ঠিকানা", permanent_area: "স্থায়ী এলাকা", division: "স্থায়ী বিভাগ", zilla: "স্থায়ী জেলা",
    upzilla: "স্থায়ী উপজেলা", present_address: "বর্তমান ঠিকানা", present_area: "বর্তমান এলাকা",
    present_division: "বর্তমান বিভাগ", present_zilla: "বর্তমান জেলা", present_upzilla: "বর্তমান উপজেলা",
    grown_up: "কোথায় বড় হয়েছেন", city: "শহর", zip: "পোস্ট কোড",
  },
  educational_qualification: {
    education_medium: "পড়াশোনার মাধ্যম", highest_edu_level: "সর্বোচ্চ শিক্ষাগত যোগ্যতা", others_edu: "অন্যান্য শিক্ষা",
    before_ssc: "এসএসসির আগে", deeni_edu: "দ্বীনি শিক্ষা", ssc_year: "এসএসসি সাল", ssc_group: "এসএসসি বিভাগ",
    ssc_result: "এসএসসি ফলাফল", after_ssc_medium: "এসএসসির পর মাধ্যম", after_ssc_running: "এসএসসির পর (চলমান)",
    after_ssc_result: "এইচএসসি/সমমান ফলাফল", after_ssc_group: "এইচএসসি/সমমান বিভাগ", after_ssc_year: "এইচএসসি/সমমান সাল",
    diploma_sub: "ডিপ্লোমা বিষয়", diploma_inst: "ডিপ্লোমা প্রতিষ্ঠান", diploma_pass_year: "ডিপ্লোমা পাসের সাল",
    diploma_running_year: "ডিপ্লোমা চলমান বর্ষ", hons_sub: "স্নাতক বিষয়", hons_inst: "স্নাতক প্রতিষ্ঠান",
    hons_year: "স্নাতক বর্ষ", hons_pass_year: "স্নাতক পাসের সাল", msc_sub: "স্নাতকোত্তর বিষয়", msc_inst: "স্নাতকোত্তর প্রতিষ্ঠান",
    msc_pass_year: "স্নাতকোত্তর পাসের সাল", phd_sub: "পিএইচডি বিষয়", phd_inst: "পিএইচডি প্রতিষ্ঠান", phd_pass_year: "পিএইচডি পাসের সাল",
    ibti_inst: "ইবতেদায়ী প্রতিষ্ঠান", ibti_result: "ইবতেদায়ী ফলাফল", ibti_pass_year: "ইবতেদায়ী পাসের সাল",
    mutawas_inst: "মুতাওয়াসসিতাহ প্রতিষ্ঠান", mutawas_result: "মুতাওয়াসসিতাহ ফলাফল", mutawas_pass_year: "মুতাওয়াসসিতাহ পাসের সাল",
    sanabiya_inst: "সানাবিয়া প্রতিষ্ঠান", sanabiya_result: "সানাবিয়া ফলাফল", sanabiya_pass_year: "সানাবিয়া পাসের সাল",
    fozilat_inst: "ফযিলত প্রতিষ্ঠান", fozilat_result: "ফযিলত ফলাফল", fozilat_pass_year: "ফযিলত পাসের সাল",
    takmil_inst: "তাকমিল প্রতিষ্ঠান", takmil_result: "তাকমিল ফলাফল", takmil_pass_year: "তাকমিল পাসের সাল",
    takhassus_inst: "তাখাসসুস প্রতিষ্ঠান", takhassus_sub: "তাখাসসুস বিষয়", takhassus_result: "তাখাসসুস ফলাফল",
    takhassus_pass_year: "তাখাসসুস পাসের সাল", status: "অবস্থা",
  },
  family_status: {
    father_name: "পিতার নাম", isFatherAlive: "পিতা জীবিত", father_occupation: "পিতার পেশা", mother_name: "মাতার নাম",
    isMotherAlive: "মাতা জীবিত", mother_occupation: "মাতার পেশা", number_of_brothers: "ভাইয়ের সংখ্যা", brother_info: "ভাইদের তথ্য",
    number_of_sisters: "বোনের সংখ্যা", sister_info: "বোনদের তথ্য", uncle_info: "চাচা/মামাদের তথ্য",
    family_eco_condition: "পারিবারিক অর্থনৈতিক অবস্থা", eco_condition_type: "অর্থনৈতিক শ্রেণি", house_type: "বাড়ির ধরন",
    family_assets: "পারিবারিক সম্পদ", family_deeni_info: "পরিবারের দ্বীনি অবস্থা",
  },
  personal_info: {
    about_me: "নিজের সম্পর্কে", my_phone: "মোবাইল নাম্বার", my_categories: "ক্যাটাগরি", physical_problem: "শারীরিক সমস্যা",
    outside_clothings: "বাইরের পোশাক", isBeard: "দাড়ি আছে", from_beard: "কবে থেকে দাড়ি", isTakhnu: "টাখনুর উপরে কাপড়",
    isDailyFive: "পাঁচ ওয়াক্ত নামাজ", daily_five_from: "কবে থেকে নামাজ", isDailyFiveJamaat: "জামাতে নামাজ",
    daily_five_jamaat_from: "কবে থেকে জামাতে", qadha_weekly: "সাপ্তাহিক কাযা নামাজ", mahram_non_mahram: "মাহরাম/নন-মাহরাম মানা",
    quran_tilawat: "কুরআন তিলাওয়াত", fiqh: "ফিকহ", natok_cinema: "নাটক/সিনেমা/গান", special_deeni_mehnot: "বিশেষ দ্বীনি মেহনত",
    mazar: "মাজার সম্পর্কে ধারণা", islamic_books: "পঠিত ইসলামী বই", islamic_scholars: "পছন্দের আলেম", isNeshaDrobbo: "নেশাদ্রব্য গ্রহণ",
    from_when_nikhab: "কবে থেকে নিকাব", about_reverted_islam: "ইসলাম গ্রহণ সম্পর্কে", about_milad_qiyam: "মিলাদ-কিয়াম সম্পর্কে",
    sampraday: "সম্প্রদায়", sub_sampraday: "উপ-সম্প্রদায়", caste: "বর্ণ", sub_caste: "উপ-বর্ণ", gotra: "গোত্র",
    belief_in_god: "ঈশ্বরে বিশ্বাস", religious_practice_level: "ধর্মচর্চার মাত্রা", regular_pooja: "নিয়মিত পূজা",
    vrat_observance: "ব্রত পালন", temple_visit_frequency: "মন্দিরে যাওয়া", ishta_devata: "ইষ্ট দেবতা", kul_devata: "কুল দেবতা",
    spiritual_guide: "আধ্যাত্মিক গুরু", food_habit: "খাদ্যাভ্যাস", alcohol_consumption: "মদ্যপান", smoking: "ধূমপান",
    marriage_view: "বিয়ে নিয়ে মতামত", vedic_marriage_interest: "বৈদিক বিবাহে আগ্রহ", kundali_matching_belief: "কুণ্ডলী মেলানোয় বিশ্বাস",
    birth_time: "জন্ম সময়", rashi: "রাশি", mangalik_status: "মাঙ্গলিক", partner_religious_expectation: "সঙ্গীর ধর্মীয় প্রত্যাশা",
    religious_flexibility: "ধর্মীয় নমনীয়তা", denomination: "ডিনোমিনেশন", church_name: "চার্চের নাম",
    bible_reading_frequency: "বাইবেল পাঠ", church_attendance: "চার্চে উপস্থিতি", church_activity_participation: "চার্চের কাজে অংশগ্রহণ",
    baptism_status: "ব্যাপটিজম", confirmation_status: "কনফার্মেশন", religious_value_importance: "ধর্মীয় মূল্যবোধের গুরুত্ব",
    follows_christian_ethics: "খ্রিস্টীয় নৈতিকতা মানেন", church_wedding_preference: "চার্চে বিয়ের পছন্দ",
    christian_partner_preference: "খ্রিস্টান সঙ্গী পছন্দ", children_religious_education: "সন্তানের ধর্মীয় শিক্ষা",
    expects_partner_cooperation: "সঙ্গীর সহযোগিতা প্রত্যাশা",
  },
  occupation: {
    occupation: "পেশা", occupation_details: "পেশার বিস্তারিত", monthly_income: "মাসিক আয়", working_history: "কাজের অভিজ্ঞতা",
  },
  marital_info: {
    isFamilyAgree: "পরিবার রাজি", isPordaToWife: "স্ত্রীকে পর্দায় রাখবেন", permission_for_study: "পড়াশোনার অনুমতি",
    permission_for_job: "চাকরির অনুমতি", isJoutuk: "যৌতুক", after_marriage_where: "বিয়ের পর কোথায় থাকবেন",
    divorced_reason: "বিবাহবিচ্ছেদের কারণ", why_marriage: "কেন বিয়ে করছেন", wife_dead_info: "স্ত্রীর মৃত্যু সংক্রান্ত",
    when_husband_dead: "স্বামীর মৃত্যু কবে", why_married_another: "আবার বিয়ের কারণ", is_running_job: "চাকরি করছেন",
    is_running_study: "পড়াশোনা চলছে", after_marriage_running_job: "বিয়ের পর চাকরি", quantity_wife_and_children: "স্ত্রী ও সন্তান সংখ্যা",
  },
  expected_life_partner: {
    color: "গাত্রবর্ণ", educational_qualifications: "শিক্ষাগত যোগ্যতা", zilla: "জেলা", marital_status: "বৈবাহিক অবস্থা",
    occupation: "পেশা", economical_condition: "অর্থনৈতিক অবস্থা", expected_characteristics: "প্রত্যাশিত বৈশিষ্ট্য",
    aqidah_madhab: "আকিদা/মাযহাব", isDivorced_Widow: "ডিভোর্সি/বিধবা চলবে", isChild: "সন্তানসহ চলবে", isMasna: "মাসনা",
    isStudent: "ছাত্র/ছাত্রী চলবে", expected_income: "প্রত্যাশিত আয়", partner_caste_preference: "বর্ণ পছন্দ",
    partner_sub_caste_preference: "উপ-বর্ণ পছন্দ", partner_gotra_preference: "গোত্র পছন্দ", partner_sampraday_preference: "সম্প্রদায় পছন্দ",
    partner_mangalik_preference: "মাঙ্গলিক পছন্দ", partner_denomination_preference: "ডিনোমিনেশন পছন্দ",
    partner_church_attendance_preference: "চার্চে উপস্থিতি পছন্দ", partner_own_home_type: "নিজের বাড়ির ধরন",
    flexibility_areas: "যেসব বিষয়ে নমনীয়", partner_father_profession: "সঙ্গীর পিতার পেশা", partner_home_type: "সঙ্গীর বাড়ির ধরন",
    min_ssc_result: "ন্যূনতম এসএসসি ফলাফল", min_hsc_result: "ন্যূনতম এইচএসসি ফলাফল",
  },
  ongikar_nama: {
    is_family_know: "পরিবার জানে", isTrueData: "তথ্য সত্য", isAgree: "শর্তে সম্মত", request_practicing_status: "প্র্যাক্টিসিং স্ট্যাটাস অনুরোধ",
  },
  contact: {
    full_name: "অভিভাবকের নাম", family_number: "অভিভাবকের মোবাইল", relation: "সম্পর্ক", bio_receiving_email: "বায়োডাটা গ্রহণের ইমেইল",
  },
  achievement: { achievements: "অর্জন" },
};

// TODO: always flagged for a careful look: photos and the paid contact details.
export const SENSITIVE_FIELDS: Record<string, string> = {
  "general_info.photos": "ছবি পরিবর্তন হয়েছে, ছবিগুলো দেখে নিন",
  "personal_info.my_phone": "মোবাইল নাম্বার (পেইড তথ্য) পরিবর্তন",
  "contact.full_name": "অভিভাবকের যোগাযোগ তথ্য (পেইড তথ্য) পরিবর্তন",
  "contact.family_number": "অভিভাবকের মোবাইল (পেইড তথ্য) পরিবর্তন",
  "contact.bio_receiving_email": "যোগাযোগ ইমেইল (পেইড তথ্য) পরিবর্তন",
};

// TODO: fields where typing a phone/email/link would leak paid contact details publicly.
export const CONTACT_FIELDS = new Set(["personal_info.my_phone", "contact.family_number", "contact.bio_receiving_email", "contact.full_name"]);
