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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailSettingsService = void 0;
const email_settings_model_1 = __importStar(require("./email_settings.model"));
const CACHE_MS = 60 * 1000;
let cache = null;
const isHttpUrl = (value) => {
    if (typeof value !== "string")
        return false;
    try {
        const url = new URL(value.trim());
        return url.protocol === "https:" || url.protocol === "http:";
    }
    catch (_a) {
        return false;
    }
};
const fetchSettings = () => __awaiter(void 0, void 0, void 0, function* () {
    const doc = yield email_settings_model_1.default.findOneAndUpdate({ key: "default" }, { $setOnInsert: { key: "default" } }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
    return {
        logo_url: (doc === null || doc === void 0 ? void 0 : doc.logo_url) || email_settings_model_1.DEFAULT_EMAIL_SETTINGS.logo_url,
        support_email: (doc === null || doc === void 0 ? void 0 : doc.support_email) || email_settings_model_1.DEFAULT_EMAIL_SETTINGS.support_email,
        social_links: (doc === null || doc === void 0 ? void 0 : doc.social_links) || [],
    };
});
exports.EmailSettingsService = {
    // TODO: cached so every email doesn't hit the database; falls back to defaults if the DB fails.
    get: () => __awaiter(void 0, void 0, void 0, function* () {
        if (cache && Date.now() - cache.at < CACHE_MS)
            return cache.value;
        try {
            const value = yield fetchSettings();
            cache = { value, at: Date.now() };
            return value;
        }
        catch (error) {
            console.error("Email settings load failed, using defaults:", error);
            return (cache === null || cache === void 0 ? void 0 : cache.value) || Object.assign({}, email_settings_model_1.DEFAULT_EMAIL_SETTINGS);
        }
    }),
    // TODO: returns cleaned settings, or an error message for the admin.
    parse: (body) => {
        if (!isHttpUrl(body === null || body === void 0 ? void 0 : body.logo_url))
            return { error: "Logo URL must be a valid http(s) link" };
        const supportEmail = typeof (body === null || body === void 0 ? void 0 : body.support_email) === "string" ? body.support_email.trim() : "";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) {
            return { error: "Support email is not valid" };
        }
        const links = Array.isArray(body === null || body === void 0 ? void 0 : body.social_links) ? body.social_links : [];
        if (links.length > 8)
            return { error: "At most 8 social links are allowed" };
        const socialLinks = [];
        for (const link of links) {
            const label = typeof (link === null || link === void 0 ? void 0 : link.label) === "string" ? link.label.trim() : "";
            if (!label || label.length > 40)
                return { error: "Each social link needs a name (up to 40 characters)" };
            if (!isHttpUrl(link === null || link === void 0 ? void 0 : link.url))
                return { error: `"${label}" needs a valid http(s) link` };
            socialLinks.push({ label, url: link.url.trim() });
        }
        return {
            data: { logo_url: body.logo_url.trim(), support_email: supportEmail, social_links: socialLinks },
        };
    },
    update: (data) => __awaiter(void 0, void 0, void 0, function* () {
        yield email_settings_model_1.default.findOneAndUpdate({ key: "default" }, data, {
            upsert: true,
            setDefaultsOnInsert: true,
        });
        cache = null;
        return exports.EmailSettingsService.get();
    }),
};
