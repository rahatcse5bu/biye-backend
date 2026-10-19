"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeaturedRequest = exports.FeaturedSettings = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// TODO: single document (key "default"); the admin sets the price and how long a biodata stays featured.
const FeaturedSettingsSchema = new mongoose_1.Schema({
    key: { type: String, default: "default", unique: true },
    enabled: { type: Boolean, default: true },
    price: { type: Number, default: 500, min: 1 },
    duration_days: { type: Number, default: 30, min: 1 },
}, { timestamps: true });
exports.FeaturedSettings = mongoose_1.default.model("FeaturedSettings", FeaturedSettingsSchema);
// TODO: one paid request per bKash payment; admin approves (features the biodata) or rejects (optionally refunds).
const FeaturedRequestSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    biodata: { type: mongoose_1.Schema.Types.ObjectId, ref: "GeneralInfo", required: true },
    bio_user_id: { type: Number },
    email: { type: String, required: true },
    payment_id: { type: String, required: true, unique: true },
    transaction_id: { type: String },
    amount: { type: Number, required: true },
    duration_days: { type: Number, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    refunded: { type: Boolean, default: false },
    admin_note: { type: String, default: "" },
    reviewed_at: { type: Date },
    featured_until: { type: Date },
    // TODO: counted only while this paid period is running, from featured slots (homepage + top of search).
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
}, { timestamps: true });
FeaturedRequestSchema.index({ biodata: 1, status: 1, featured_until: 1 });
exports.FeaturedRequest = mongoose_1.default.model("FeaturedRequest", FeaturedRequestSchema);
