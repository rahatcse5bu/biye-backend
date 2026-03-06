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
// Working History Sub-schema
const WorkingHistorySchema = new mongoose_1.Schema({
    company_name: { type: String, required: true },
    designation: { type: String, required: true },
    start_date: { type: String, required: false },
    end_date: { type: String, required: false },
    is_current: { type: Boolean, default: false },
    job_description: { type: String, required: false },
}, { _id: false });
// Mongoose schema for Occupation
const OccupationSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    occupation: [],
    occupation_details: { type: String, required: true },
    monthly_income: { type: Number, required: true },
    working_history: { type: [WorkingHistorySchema], default: [] },
}, {
    timestamps: true,
});
// Export the Occupation model
const Occupation = mongoose_1.default.model("Occupation", OccupationSchema);
exports.default = Occupation;
