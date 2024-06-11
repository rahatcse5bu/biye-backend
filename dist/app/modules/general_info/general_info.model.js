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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/models/GeneralInfo.ts
const mongoose_1 = __importStar(require("mongoose"));
const GeneralInfoSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    bio_type: { type: String, required: true },
    isMarriageDone: { type: Boolean, required: true },
    date_of_birth: { type: Date, required: true },
    height: { type: Number, required: true },
    gender: { type: String, required: true },
    weight: { type: Number, required: true },
    blood_group: { type: String, required: true },
    screen_color: { type: String, required: true },
    nationality: { type: String, required: true },
    marital_status: { type: String, required: true },
    views_count: { type: Number, default: 0 },
    likes_count: { type: Number, default: 0 },
    dislikes_count: { type: Number, default: 0 },
    purchases_count: { type: Number, default: 0 },
    isFbPosted: { type: Boolean, default: false, required: false },
    isFeatured: { type: Boolean, required: false, default: false },
    zilla: { type: String, required: false },
}, {
    timestamps: true,
});
const GeneralInfo = mongoose_1.default.model("GeneralInfo", GeneralInfoSchema);
exports.default = GeneralInfo;
