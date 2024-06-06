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
// models/userFamilyInfo.model.ts
const mongoose_1 = __importStar(require("mongoose"));
const UserFamilyInfoSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    father_name: { type: String, required: true },
    father_occupation: { type: String, required: true },
    isFatherAlive: { type: String, required: true },
    mother_name: { type: String, required: true },
    isMotherAlive: { type: String, required: true },
    mother_occupation: { type: String, required: true },
    number_of_brothers: { type: String, required: true },
    brother_info: [{ type: String, required: true }],
    number_of_sisters: { type: String, required: true },
    sister_info: [{ type: String, required: true }],
    uncle_info: { type: String, required: true },
    family_eco_condition: { type: String, required: true },
    eco_condition_type: { type: String, required: true },
    family_deeni_info: { type: String, required: true },
}, {
    timestamps: true,
});
const FamilyStatus = mongoose_1.default.model("FamilyStatus", UserFamilyInfoSchema);
exports.default = FamilyStatus;
