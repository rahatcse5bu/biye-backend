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
exports.DEFAULT_EMAIL_SETTINGS = exports.LEGACY_LOGO_URL = exports.DEFAULT_DAILY_EMAIL_LIMIT = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// TODO: Gmail allows ~500 recipients per rolling 24h; Google Workspace allows 2000.
exports.DEFAULT_DAILY_EMAIL_LIMIT = 500;
// TODO: the old default header logo; treated as "no override" so existing installs get the Figma logo.
exports.LEGACY_LOGO_URL = "https://res.cloudinary.com/dfcyydhfn/image/upload/v1791121207/logo_vmmj9g.png";
exports.DEFAULT_EMAIL_SETTINGS = {
    // TODO: empty means the built-in rings + বিয়ে wordmark header.
    logo_url: "",
    support_email: "bibahosupport@gmail.com",
    support_phone: "+880 1793-278360",
    social_links: [],
};
// TODO: single document (key "default") with the branding every email uses.
const EmailSettingsSchema = new mongoose_1.Schema({
    key: { type: String, default: "default", unique: true },
    logo_url: { type: String, default: exports.DEFAULT_EMAIL_SETTINGS.logo_url },
    support_email: { type: String, default: exports.DEFAULT_EMAIL_SETTINGS.support_email },
    support_phone: { type: String, default: exports.DEFAULT_EMAIL_SETTINGS.support_phone },
    social_links: {
        type: [{ _id: false, label: { type: String, required: true }, url: { type: String, required: true } }],
        default: [],
    },
    daily_limit: { type: Number, default: exports.DEFAULT_DAILY_EMAIL_LIMIT, min: 1 },
}, { timestamps: true });
const EmailSettings = mongoose_1.default.model("EmailSettings", EmailSettingsSchema);
exports.default = EmailSettings;
