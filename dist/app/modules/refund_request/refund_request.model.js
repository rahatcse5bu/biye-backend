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
const RefundRequestSchema = new mongoose_1.Schema({
    // TODO: unique so each payment can be requested only once.
    payment: { type: mongoose_1.Schema.Types.ObjectId, ref: "Payment", required: true, unique: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    email: { type: String, required: true },
    transaction_id: { type: String, required: true },
    paid_amount: { type: Number, required: true },
    refund_amount: { type: Number, required: true, min: 1 },
    points_held: { type: Number, required: true, min: 0 },
    reason: { type: String, trim: true, default: "" },
    status: {
        type: String,
        enum: ["requested", "refunded", "rejected"],
        default: "requested",
        index: true,
    },
    admin_note: { type: String, trim: true },
    refund_trx_id: { type: String },
    processed_at: { type: Date },
}, { timestamps: true });
const RefundRequest = mongoose_1.default.model("RefundRequest", RefundRequestSchema);
exports.default = RefundRequest;
