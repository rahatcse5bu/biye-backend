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
const UnverifiedContactPurchaseSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "User" },
    unverified_biodata: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "UnverifiedBiodata",
    },
    points_spent: { type: Number, default: 50 },
    contact_info: {
        full_name: { type: String, required: true },
        family_number: { type: String, required: true },
        bio_receiving_email: { type: String, required: true },
    },
}, { timestamps: true });
// Ensure unique purchase per user per biodata
UnverifiedContactPurchaseSchema.index({ user: 1, unverified_biodata: 1 }, { unique: true });
const UnverifiedContactPurchase = mongoose_1.default.model("UnverifiedContactPurchase", UnverifiedContactPurchaseSchema);
exports.default = UnverifiedContactPurchase;
