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
const mongoose_1 = __importStar(require("mongoose"));
// Step 2: Create the Mongoose Schema and Model
const ExpectedPartnerSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    age: {
        min: {
            type: Number,
            default: 40,
        },
        max: {
            type: Number,
            default: 70,
        },
    },
    color: [],
    height: {
        min: {
            type: Number,
            default: 4,
        },
        max: {
            type: Number,
            default: 6,
        },
    },
    educational_qualifications: [],
    zilla: [],
    marital_status: [],
    occupation: [],
    economical_condition: [],
    expected_characteristics: { type: String, required: false },
    aqidah_madhab: { type: String, required: false },
    isDivorced_Widow: { type: String, required: false },
    isChild: { type: String, required: false },
    isMasna: { type: String, required: false },
    isStudent: { type: String, required: false },
    expected_income: { type: Number, required: false },
    // Hindu-specific partner expectations
    partner_caste_preference: [{ type: String }],
    partner_sub_caste_preference: [{ type: String }],
    partner_gotra_preference: { type: String, required: false },
    partner_sampraday_preference: [{ type: String }],
    partner_mangalik_preference: { type: String, required: false },
    // Christian-specific partner expectations
    partner_denomination_preference: [{ type: String }],
    partner_church_attendance_preference: { type: String, required: false },
    // Common fields for all religions
    partner_own_home_type: [{ type: String }],
    flexibility_areas: [{ type: String }],
    partner_father_profession: [{ type: String }],
    partner_home_type: [{ type: String }],
    min_ssc_result: [{ type: String }],
    min_hsc_result: [{ type: String }],
});
const ExpectedPartner = mongoose_1.default.model("ExpectedPartner", ExpectedPartnerSchema);
exports.default = ExpectedPartner;
