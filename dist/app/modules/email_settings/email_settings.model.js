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
exports.DEFAULT_EMAIL_SETTINGS = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.DEFAULT_EMAIL_SETTINGS = {
    logo_url: "https://res.cloudinary.com/dfcyydhfn/image/upload/v1791121207/logo_vmmj9g.png",
    support_email: "bibahosupport@gmail.com",
    social_links: [],
};
// TODO: single document (key "default") with the branding every email uses.
const EmailSettingsSchema = new mongoose_1.Schema({
    key: { type: String, default: "default", unique: true },
    logo_url: { type: String, default: exports.DEFAULT_EMAIL_SETTINGS.logo_url },
    support_email: { type: String, default: exports.DEFAULT_EMAIL_SETTINGS.support_email },
    social_links: {
        type: [{ _id: false, label: { type: String, required: true }, url: { type: String, required: true } }],
        default: [],
    },
}, { timestamps: true });
const EmailSettings = mongoose_1.default.model("EmailSettings", EmailSettingsSchema);
exports.default = EmailSettings;
