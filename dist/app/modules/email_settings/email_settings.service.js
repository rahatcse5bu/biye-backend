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
    var _a, _b;
    const doc = yield email_settings_model_1.default.findOneAndUpdate({ key: "default" }, { $setOnInsert: { key: "default" } }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
    return {
        logo_url: !(doc === null || doc === void 0 ? void 0 : doc.logo_url) || doc.logo_url === email_settings_model_1.LEGACY_LOGO_URL ? email_settings_model_1.DEFAULT_EMAIL_SETTINGS.logo_url : doc.logo_url,
        support_email: (doc === null || doc === void 0 ? void 0 : doc.support_email) || email_settings_model_1.DEFAULT_EMAIL_SETTINGS.support_email,
        support_phone: (_a = doc === null || doc === void 0 ? void 0 : doc.support_phone) !== null && _a !== void 0 ? _a : email_settings_model_1.DEFAULT_EMAIL_SETTINGS.support_phone,
        social_links: (doc === null || doc === void 0 ? void 0 : doc.social_links) || [],
        // TODO: docs saved before footer_links existed have no field; an emptied list stays empty.
        footer_links: (_b = doc === null || doc === void 0 ? void 0 : doc.footer_links) !== null && _b !== void 0 ? _b : email_settings_model_1.DEFAULT_EMAIL_SETTINGS.footer_links,
        sender_name: (doc === null || doc === void 0 ? void 0 : doc.sender_name) || email_settings_model_1.DEFAULT_EMAIL_SETTINGS.sender_name,
        disabled_templates: ((doc === null || doc === void 0 ? void 0 : doc.disabled_templates) || []).filter((id) => !email_settings_model_1.LOCKED_TEMPLATES.includes(id)),
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
        const logoUrl = typeof (body === null || body === void 0 ? void 0 : body.logo_url) === "string" ? body.logo_url.trim() : "";
        if (logoUrl && !isHttpUrl(logoUrl))
            return { error: "Logo URL must be a valid http(s) link, or empty for the default logo" };
        const supportEmail = typeof (body === null || body === void 0 ? void 0 : body.support_email) === "string" ? body.support_email.trim() : "";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) {
            return { error: "Support email is not valid" };
        }
        const supportPhone = typeof (body === null || body === void 0 ? void 0 : body.support_phone) === "string" ? body.support_phone.trim() : "";
        if (supportPhone.length > 30 || /[^\d+\-\s()]/.test(supportPhone)) {
            return { error: "Support phone may contain only digits, spaces, +, - and brackets (up to 30)" };
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
        const footer = Array.isArray(body === null || body === void 0 ? void 0 : body.footer_links) ? body.footer_links : [];
        if (footer.length > 8)
            return { error: "At most 8 footer links are allowed" };
        const footerLinks = [];
        for (const link of footer) {
            const label = typeof (link === null || link === void 0 ? void 0 : link.label) === "string" ? link.label.trim() : "";
            if (!label || label.length > 40)
                return { error: "Each footer link needs a name (up to 40 characters)" };
            const url = typeof (link === null || link === void 0 ? void 0 : link.url) === "string" ? link.url.trim() : "";
            if (!/^\/[^\s/]/.test(url) && !isHttpUrl(url)) {
                return { error: `"${label}" needs a site path like /privacy-policy or a valid http(s) link` };
            }
            footerLinks.push({ label, url });
        }
        const senderName = typeof (body === null || body === void 0 ? void 0 : body.sender_name) === "string" ? body.sender_name.trim() : "";
        if (!senderName || senderName.length > 60 || /["<>\\\r\n]/.test(senderName)) {
            return { error: "Sender name is required (up to 60 characters, no quotes or < >)" };
        }
        const disabled = Array.isArray(body === null || body === void 0 ? void 0 : body.disabled_templates) ? body.disabled_templates : [];
        const disabledTemplates = [
            ...new Set(disabled.filter((id) => typeof id === "string" && /^[A-Za-z]{1,40}$/.test(id))),
        ].filter((id) => !email_settings_model_1.LOCKED_TEMPLATES.includes(id));
        return {
            data: {
                logo_url: logoUrl,
                support_email: supportEmail,
                support_phone: supportPhone,
                social_links: socialLinks,
                footer_links: footerLinks,
                sender_name: senderName,
                disabled_templates: disabledTemplates,
            },
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
