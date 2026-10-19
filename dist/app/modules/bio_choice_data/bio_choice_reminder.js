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
exports.reminderStatus = exports.ReminderSettingsService = exports.DEFAULT_REMINDER_SETTINGS = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.DEFAULT_REMINDER_SETTINGS = { max_emails: 3, cooldown_hours: 24 };
// TODO: single document (key "default") with the admin-set limits for proposal reminder emails.
const ReminderSettingsSchema = new mongoose_1.Schema({
    key: { type: String, default: "default", unique: true },
    max_emails: { type: Number, default: exports.DEFAULT_REMINDER_SETTINGS.max_emails, min: 0 },
    cooldown_hours: { type: Number, default: exports.DEFAULT_REMINDER_SETTINGS.cooldown_hours, min: 0 },
}, { timestamps: true });
const ReminderSettingsModel = mongoose_1.default.model("ProposalReminderSettings", ReminderSettingsSchema);
const CACHE_MS = 60 * 1000;
let cache = null;
exports.ReminderSettingsService = {
    get: () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        if (cache && Date.now() - cache.at < CACHE_MS)
            return cache.value;
        const doc = yield ReminderSettingsModel.findOneAndUpdate({ key: "default" }, { $setOnInsert: { key: "default" } }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
        const value = {
            max_emails: (_a = doc === null || doc === void 0 ? void 0 : doc.max_emails) !== null && _a !== void 0 ? _a : exports.DEFAULT_REMINDER_SETTINGS.max_emails,
            cooldown_hours: (_b = doc === null || doc === void 0 ? void 0 : doc.cooldown_hours) !== null && _b !== void 0 ? _b : exports.DEFAULT_REMINDER_SETTINGS.cooldown_hours,
        };
        cache = { value, at: Date.now() };
        return value;
    }),
    // TODO: returns cleaned settings, or an error message for the admin.
    parse: (body) => {
        const maxEmails = Number(body === null || body === void 0 ? void 0 : body.max_emails);
        const cooldownHours = Number(body === null || body === void 0 ? void 0 : body.cooldown_hours);
        if (!Number.isInteger(maxEmails) || maxEmails < 0 || maxEmails > 20) {
            return { error: "Emails per proposal must be a whole number from 0 to 20" };
        }
        if (!Number.isFinite(cooldownHours) || cooldownHours < 0 || cooldownHours > 720) {
            return { error: "Wait between emails must be from 0 to 720 hours" };
        }
        return { data: { max_emails: maxEmails, cooldown_hours: cooldownHours } };
    },
    update: (data) => __awaiter(void 0, void 0, void 0, function* () {
        yield ReminderSettingsModel.findOneAndUpdate({ key: "default" }, data, {
            upsert: true,
            setDefaultsOnInsert: true,
        });
        cache = null;
        return exports.ReminderSettingsService.get();
    }),
};
// TODO: what the sender sees: used/allowed counts and when the next email unlocks (null = now or never).
const reminderStatus = (choice, settings) => {
    const sent = choice.reminder_emails_sent || 0;
    const remaining = Math.max(0, settings.max_emails - sent);
    const last = choice.last_reminder_at ? new Date(choice.last_reminder_at).getTime() : 0;
    const unlockAt = last + settings.cooldown_hours * 60 * 60 * 1000;
    const waiting = remaining > 0 && last > 0 && unlockAt > Date.now();
    return {
        sent,
        limit: settings.max_emails,
        remaining,
        cooldown_hours: settings.cooldown_hours,
        next_available_at: waiting ? new Date(unlockAt).toISOString() : null,
        can_send: choice.status === "pending" && remaining > 0 && !waiting,
    };
};
exports.reminderStatus = reminderStatus;
