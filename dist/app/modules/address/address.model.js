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
const mongoose_1 = __importStar(require("mongoose"));
// Define Address Schema
const addressSchema = new mongoose_1.Schema({
    // TODO: every biodata section is looked up by user, so it needs an index.
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    permanent_address: { type: String, required: true },
    present_address: { type: String, required: true },
    grown_up: { type: String, required: true },
    present_area: { type: String, required: true },
    permanent_area: { type: String, required: true },
    zilla: { type: String, required: true },
    upzilla: { type: String, required: true },
    division: { type: String, required: true },
    present_zilla: { type: String, required: true },
    present_upzilla: { type: String, required: true },
    present_division: { type: String, required: true },
    city: { type: String, required: true },
    zip: { type: Number, required: false, default: 0 },
}, {
    timestamps: true,
});
// Create Address model
const Address = mongoose_1.default.model("Address", addressSchema);
exports.default = Address;
