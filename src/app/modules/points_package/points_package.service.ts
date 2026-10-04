import PointsPackage, { IPointsPackage } from "./points_package.model";
import CustomPointsSettings, {
  ICustomPointsSettings,
} from "./custom_points.model";

const customSettingsFields = "enabled points_per_taka min_amount max_amount";

const defaultPackages = [
  { name: "বেসিক প্যাকেজ", price: 30, points: 36, features: ["সর্বোচ্চ ১ বার বায়োডাটা শেয়ার", "সর্বোচ্চ ০ বার অভিভাবকের তথ্য"] },
  { name: "স্ট্যান্ডার্ড প্যাকেজ", price: 100, points: 120, features: ["সর্বোচ্চ ৩ বার বায়োডাটা শেয়ার", "সর্বোচ্চ ১ বার অভিভাবকের তথ্য"] },
  { name: "প্রিমিয়াম প্যাকেজ", price: 200, points: 240, features: ["সর্বোচ্চ ৭ বার বায়োডাটা শেয়ার", "সর্বোচ্চ ৩ বার অভিভাবকের তথ্য"] },
  { name: "প্রো প্যাকেজ", price: 300, points: 360, features: ["সর্বোচ্চ ১১ বার বায়োডাটা শেয়ার", "সর্বোচ্চ ৪ বার অভিভাবকের তথ্য"] },
  { name: "এন্টারপ্রাইজ প্যাকেজ", price: 500, points: 600, features: ["সর্বোচ্চ ১৮ বার বায়োডাটা শেয়ার", "সর্বোচ্চ ৮ বার অভিভাবকের তথ্য"] },
  { name: "এন্টারপ্রাইজ প্রো প্যাকেজ", price: 1000, points: 1200, features: ["সর্বোচ্চ ৩৬ বার বায়োডাটা শেয়ার", "সর্বোচ্চ ১৫ বার অভিভাবকের তথ্য"] },
].map((item, index) => ({ ...item, sort_order: index + 1 }));

// TODO: seeds the old hard-coded packages the first time the collection is empty.
const seedIfEmpty = async () => {
  if (await PointsPackage.exists({})) return;
  await PointsPackage.insertMany(defaultPackages, { ordered: false }).catch(
    (error) => {
      if (error?.code !== 11000) throw error;
    },
  );
};

const sortOrder = { sort_order: 1, price: 1 } as const;

export const PointsPackageService = {
  listActive: async () => {
    await seedIfEmpty();
    return PointsPackage.find({ is_active: true }).sort(sortOrder).lean();
  },

  listAll: async () => {
    await seedIfEmpty();
    return PointsPackage.find().sort(sortOrder).lean();
  },

  create: async (data: Partial<IPointsPackage>) =>
    (await PointsPackage.create(data)).toObject(),

  update: async (id: string, data: Partial<IPointsPackage>) =>
    PointsPackage.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean(),

  remove: async (id: string) => PointsPackage.findByIdAndDelete(id).lean(),

  findActiveByPrice: async (price: number) =>
    PointsPackage.findOne({ price, is_active: true }).lean(),

  getCustomSettings: async () =>
    CustomPointsSettings.findOneAndUpdate(
      { key: "default" },
      { $setOnInsert: { key: "default" } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )
      .select(customSettingsFields)
      .lean(),

  updateCustomSettings: async (data: Partial<ICustomPointsSettings>) =>
    CustomPointsSettings.findOneAndUpdate({ key: "default" }, data, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    })
      .select(customSettingsFields)
      .lean(),

  // TODO: package price match wins; otherwise the admin-set custom rate, rounded down.
  pointsForAmount: async (amount: number): Promise<number> => {
    const matched = await PointsPackageService.findActiveByPrice(amount);
    if (matched) return matched.points;
    const settings = await PointsPackageService.getCustomSettings();
    return Math.floor(amount * settings.points_per_taka + 1e-9);
  },
};
