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
// src/models/GeneralInfo.ts
const mongoose_1 = __importStar(require("mongoose"));
const GeneralInfoSchema = new mongoose_1.Schema({
    // TODO: every biodata section is looked up by user, so it needs an index.
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    refer_user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: false },
    bio_type: { type: String, required: true },
    isMarriageDone: { type: Boolean, default: false },
    date_of_birth: { type: Date, required: true },
    height: { type: Number, required: true },
    gender: { type: String, required: true },
    weight: { type: Number, required: true },
    blood_group: { type: String, required: true },
    screen_color: { type: String, required: true },
    nationality: { type: String, required: true },
    marital_status: { type: String, required: true },
    religion: { type: String, required: false, default: "islam", enum: ["islam", "hinduism", "christianity"] },
    religious_type: { type: String, required: false, enum: ["practicing_muslim", "general_muslim", "practicing_hindu", "general_hindu", "practicing_christian", "general_christian"] },
    request_practicing_status: { type: Boolean, required: false, default: false },
    photos: { type: [String], required: false, default: [], validate: [(v) => v.length <= 5, 'Maximum 5 photos allowed'] },
    views_count: { type: Number, default: 0 },
    likes_count: { type: Number, default: 0 },
    dislikes_count: { type: Number, default: 0 },
    purchases_count: { type: Number, default: 0 },
    isFbPosted: { type: Boolean, default: false, required: false },
    isFeatured: { type: Boolean, required: false, default: false },
    // TODO: set by a paid featured request; empty means featured until an admin turns it off.
    featured_until: { type: Date, required: false, default: null, index: true },
    zilla: { type: String, required: false },
    biodata_status: { type: String, enum: ['pending', 'approved', 'rejected', 'changes_requested'], default: 'pending' },
    version: { type: Number, default: 1 },
    approved_data: { type: mongoose_1.Schema.Types.Mixed, required: false, default: null },
    pending_changes: { type: mongoose_1.Schema.Types.Mixed, required: false, default: null },
    admin_note: { type: String, required: false, default: '' },
    last_approved_at: { type: Date, required: false, default: null },
    last_approved_by: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: false, default: null },
}, {
    timestamps: true,
});
const GeneralInfo = mongoose_1.default.model("GeneralInfo", GeneralInfoSchema);
exports.default = GeneralInfo;
