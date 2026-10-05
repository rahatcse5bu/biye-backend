"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointsPackageService = void 0;
const points_package_model_1 = __importDefault(require("./points_package.model"));
const custom_points_model_1 = __importDefault(require("./custom_points.model"));
const customSettingsFields = "enabled points_per_taka min_amount max_amount";
const defaultPackages = [
    { name: "বেসিক প্যাকেজ", price: 30, points: 36, features: ["সর্বোচ্চ ১ বার বায়োডাটা শেয়ার", "সর্বোচ্চ ০ বার অভিভাবকের তথ্য"] },
    { name: "স্ট্যান্ডার্ড প্যাকেজ", price: 100, points: 120, features: ["সর্বোচ্চ ৩ বার বায়োডাটা শেয়ার", "সর্বোচ্চ ১ বার অভিভাবকের তথ্য"] },
    { name: "প্রিমিয়াম প্যাকেজ", price: 200, points: 240, features: ["সর্বোচ্চ ৭ বার বায়োডাটা শেয়ার", "সর্বোচ্চ ৩ বার অভিভাবকের তথ্য"] },
    { name: "প্রো প্যাকেজ", price: 300, points: 360, features: ["সর্বোচ্চ ১১ বার বায়োডাটা শেয়ার", "সর্বোচ্চ ৪ বার অভিভাবকের তথ্য"] },
    { name: "এন্টারপ্রাইজ প্যাকেজ", price: 500, points: 600, features: ["সর্বোচ্চ ১৮ বার বায়োডাটা শেয়ার", "সর্বোচ্চ ৮ বার অভিভাবকের তথ্য"] },
    { name: "এন্টারপ্রাইজ প্রো প্যাকেজ", price: 1000, points: 1200, features: ["সর্বোচ্চ ৩৬ বার বায়োডাটা শেয়ার", "সর্বোচ্চ ১৫ বার অভিভাবকের তথ্য"] },
].map((item, index) => (Object.assign(Object.assign({}, item), { sort_order: index + 1 })));
// TODO: seeds the old hard-coded packages the first time the collection is empty.
const seedIfEmpty = () => __awaiter(void 0, void 0, void 0, function* () {
    if (yield points_package_model_1.default.exists({}))
        return;
    yield points_package_model_1.default.insertMany(defaultPackages, { ordered: false }).catch((error) => {
        if ((error === null || error === void 0 ? void 0 : error.code) !== 11000)
            throw error;
    });
});
const sortOrder = { sort_order: 1, price: 1 };
exports.PointsPackageService = {
    listActive: () => __awaiter(void 0, void 0, void 0, function* () {
        yield seedIfEmpty();
        return points_package_model_1.default.find({ is_active: true }).sort(sortOrder).lean();
    }),
    listAll: () => __awaiter(void 0, void 0, void 0, function* () {
        yield seedIfEmpty();
        return points_package_model_1.default.find().sort(sortOrder).lean();
    }),
    create: (data) => __awaiter(void 0, void 0, void 0, function* () { return (yield points_package_model_1.default.create(data)).toObject(); }),
    update: (id, data) => __awaiter(void 0, void 0, void 0, function* () {
        return points_package_model_1.default.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        }).lean();
    }),
    remove: (id) => __awaiter(void 0, void 0, void 0, function* () { return points_package_model_1.default.findByIdAndDelete(id).lean(); }),
    findActiveByPrice: (price) => __awaiter(void 0, void 0, void 0, function* () { return points_package_model_1.default.findOne({ price, is_active: true }).lean(); }),
    getCustomSettings: () => __awaiter(void 0, void 0, void 0, function* () {
        return custom_points_model_1.default.findOneAndUpdate({ key: "default" }, { $setOnInsert: { key: "default" } }, { upsert: true, new: true, setDefaultsOnInsert: true })
            .select(customSettingsFields)
            .lean();
    }),
    updateCustomSettings: (data) => __awaiter(void 0, void 0, void 0, function* () {
        return custom_points_model_1.default.findOneAndUpdate({ key: "default" }, data, {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
            runValidators: true,
        })
            .select(customSettingsFields)
            .lean();
    }),
    // TODO: package price match wins; otherwise the admin-set custom rate, rounded down.
    pointsForAmount: (amount) => __awaiter(void 0, void 0, void 0, function* () {
        const matched = yield exports.PointsPackageService.findActiveByPrice(amount);
        if (matched)
            return matched.points;
        const settings = yield exports.PointsPackageService.getCustomSettings();
        return Math.floor(amount * settings.points_per_taka + 1e-9);
    }),
};
