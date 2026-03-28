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
let counter = 0;
const UnverifiedBiodataSchema = new mongoose_1.Schema({
    bio_type: { type: String, required: true },
    gender: { type: String, required: true },
    date_of_birth: { type: Date, required: true },
    height: { type: Number, required: true },
    weight: { type: Number, required: true },
    blood_group: { type: String, required: true },
    screen_color: { type: String, required: true },
    nationality: { type: String, required: true, default: "বাংলাদেশী" },
    marital_status: { type: String, required: true },
    religion: {
        type: String,
        required: true,
        default: "islam",
        enum: ["islam", "hinduism", "christianity"],
    },
    religious_type: { type: String, required: false },
    photos: {
        type: [String],
        default: [],
        validate: [(v) => v.length <= 5, "Maximum 5 photos allowed"],
    },
    zilla: { type: String, required: true },
    upzilla: { type: String, required: false, default: "" },
    division: { type: String, required: false, default: "" },
    extra_fields: {
        type: [
            {
                label: { type: String, required: true },
                value: { type: mongoose_1.Schema.Types.Mixed, required: true },
                fieldType: { type: String, required: true, enum: ["section", "text", "multi-line", "numeric", "email", "phone", "select", "boolean"] },
                options: { type: [String], default: [] },
            },
        ],
        default: [],
    },
    contact_name: { type: String, required: false, default: "" },
    contact_phone: { type: String, required: false, default: "" },
    contact_email: { type: String, required: false, default: "" },
    views_count: { type: Number, default: 0 },
    purchases_count: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
    created_by: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    bio_id: { type: Number, unique: true },
}, { timestamps: true });
// Auto-generate a unique bio_id using timestamp + counter
UnverifiedBiodataSchema.pre("save", function (next) {
    if (!this.bio_id) {
        counter = (counter + 1) % 10000;
        this.bio_id = Date.now() * 10000 + counter;
    }
    next();
});
const UnverifiedBiodata = mongoose_1.default.model("UnverifiedBiodata", UnverifiedBiodataSchema);
exports.default = UnverifiedBiodata;
