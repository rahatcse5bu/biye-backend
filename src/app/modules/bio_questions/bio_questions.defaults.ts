import { Schema, model } from "mongoose";

export const RELIGIONS = ["islam", "hinduism", "christianity"] as const;
export type Religion = (typeof RELIGIONS)[number];

// TODO: the original built-in sets; used once to seed the database, then admins edit them.
export const SEED_DEFAULT_QUESTIONS: Record<string, string[]> = {
  islam: [
    "মেয়েদের চোখ ঢাকা নিকাব পড়াকে অনেকে বাড়াবাড়ি মনে করে। ইসলাম তো সহজ, আপনি এব্যাপারে কি মনে করেন?",
    "প্রচন্ড বৃষ্টি হচ্ছে, মসজিদ যদিও কাছে মোটামুটি। হয়ত ছাতাও আছে যাওয়ার। কিন্তু ইসলাম তো সহজ, এখানে তো রুখসত আছে। কিন্তু অনেক অতি উৎসাহী আছে যারা এসব ঝড়-বৃষ্টি উপেক্ষা করেও যায় মসজিদে। এরকম বাড়াবাড়ি যারা করে তাদের ব্যাপারে আপনার মন্তব্য কি??",
    "ছেলেদের ইউনিভার্সিটিতে পড়াশুনা করার ব্যাপারে আপনার মতামত কি?",
    "অনেক দ্বীনদার মেয়ে ভার্সিটিতে পড়াশুনা করতে চায় এজন্য তাদের দ্বিনি পরিবেশ খুঁজে|শুরুতে জেনেশুনে মেয়েদের জন্য ভার্সিটিতে পড়তে চাওয়ার বিষয়ে আপনি কি মনে করেন??",
    "পর্দা করে অনলাইনে হিজাব নিকাবের ব্যাবসা তো হালাল।ভিডিও(মডেলিং) বানিয়ে তা দিয়ে একটা আউটসোর্সিং বা ব্যবসা করতে চাইলে আপনার থেকে কোনো হেল্প পেতে পারি? বা পারমিশন পেতে পারি?",
    "অমুক তার ছেলেকে ভার্সিটিতে ভর্তি হতে দিতে চায় না কারন ইসলামী পরিবেশ পাবে না। এরকম বাড়াবাড়ির ব্যাপারে আপনার মতামত কি?",
  ],
  hinduism: [
    "আপনার পরিবারে নিয়মিত পূজা-অর্চনা হয় কি?",
    "আপনি কি নিরামিষভোজী নাকি আমিষভোজী? জীবনসঙ্গীর খাদ্যাভ্যাস নিয়ে আপনার মতামত কি?",
    "বিবাহের ক্ষেত্রে জাতি/বর্ণ কতটা গুরুত্বপূর্ণ বলে আপনি মনে করেন?",
    "যৌতুক প্রথা সম্পর্কে আপনার মতামত কি?",
    "বিবাহের পর আপনি যৌথ পরিবারে থাকতে চান নাকি আলাদা?",
    "ধর্মীয় আচার-অনুষ্ঠান ও উৎসবে আপনি কতটা সক্রিয়?",
  ],
  christianity: [
    "আপনি নিয়মিত গির্জায় যান কি? কোন গির্জা/মণ্ডলীতে যোগ দেন?",
    "আপনার বিশ্বাসের ভিত্তি কি? বাইবেল পড়া ও প্রার্থনা আপনার দৈনন্দিন জীবনে কতটা গুরুত্বপূর্ণ?",
    "বিবাহকে আপনি কিভাবে দেখেন — সামাজিক চুক্তি নাকি ঈশ্বরের সামনে পবিত্র অঙ্গীকার?",
    "জীবনসঙ্গী নির্বাচনে ডিনমিনেশন (ক্যাথলিক, প্রোটেস্ট্যান্ট ইত্যাদি) কতটা গুরুত্বপূর্ণ?",
    "বিবাহের পর পারিবারিক ও ধর্মীয় দায়িত্ব কিভাবে ভাগ করতে চান?",
    "সন্তান লালন-পালনে খ্রিস্টীয় মূল্যবোধ কিভাবে শেখাতে চান?",
  ],
};

// TODO: one admin-managed default question set per religion.
const DefaultBioQuestionsSchema = new Schema(
  {
    religion: { type: String, enum: RELIGIONS, required: true, unique: true },
    questions: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const DefaultBioQuestions = model("DefaultBioQuestions", DefaultBioQuestionsSchema);

const CACHE_MS = 60 * 1000;
let cache: { value: Record<string, string[]>; at: number } | null = null;

const loadAll = async (): Promise<Record<string, string[]>> => {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  const docs: any[] = await DefaultBioQuestions.find().lean();
  const missing = RELIGIONS.filter((religion) => !docs.some((doc) => doc.religion === religion));
  if (missing.length) {
    await DefaultBioQuestions.insertMany(
      missing.map((religion) => ({ religion, questions: SEED_DEFAULT_QUESTIONS[religion] })),
      { ordered: false },
    ).catch((error) => {
      if (error?.code !== 11000) throw error;
    });
    return loadAll();
  }
  const value = Object.fromEntries(docs.map((doc) => [doc.religion, doc.questions]));
  cache = { value, at: Date.now() };
  return value;
};

export const DefaultQuestionService = {
  // TODO: unknown or missing religion falls back to islam, matching the old behaviour.
  forReligion: async (religion?: string | null): Promise<{ religion: Religion; questions: string[] }> => {
    const key = (RELIGIONS as readonly string[]).includes(String(religion).toLowerCase())
      ? (String(religion).toLowerCase() as Religion)
      : "islam";
    const all = await loadAll();
    return { religion: key, questions: all[key] || SEED_DEFAULT_QUESTIONS[key] };
  },

  listAll: async () => {
    const all = await loadAll();
    return RELIGIONS.map((religion) => ({ religion, questions: all[religion] || [] }));
  },

  update: async (religion: Religion, questions: string[]) => {
    await DefaultBioQuestions.findOneAndUpdate({ religion }, { questions }, { upsert: true });
    cache = null;
    return DefaultQuestionService.forReligion(religion);
  },
};
