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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailUsageService = void 0;
const email_log_model_1 = __importDefault(require("./email_log.model"));
const email_settings_model_1 = __importStar(require("../email_settings/email_settings.model"));
const DAY_MS = 24 * 60 * 60 * 1000;
const WARNING_RATIO = 0.8;
exports.EmailUsageService = {
    getDailyLimit: () => __awaiter(void 0, void 0, void 0, function* () {
        const doc = yield email_settings_model_1.default.findOne({ key: "default" }).select("daily_limit").lean();
        return (doc === null || doc === void 0 ? void 0 : doc.daily_limit) || email_settings_model_1.DEFAULT_DAILY_EMAIL_LIMIT;
    }),
    setDailyLimit: (limit) => __awaiter(void 0, void 0, void 0, function* () {
        yield email_settings_model_1.default.findOneAndUpdate({ key: "default" }, { daily_limit: limit }, { upsert: true, setDefaultsOnInsert: true });
        return limit;
    }),
    // TODO: Gmail gives no quota API over SMTP, so usage is counted from our own send log.
    getUsage: () => __awaiter(void 0, void 0, void 0, function* () {
        const now = Date.now();
        const since = new Date(now - DAY_MS);
        const weekStart = new Date(now - 7 * DAY_MS);
        const [limit, totals, sentLast24h, oldestInWindow, lastLimitHit, recentFailures, daily, firstLog] = yield Promise.all([
            exports.EmailUsageService.getDailyLimit(),
            email_log_model_1.default.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
            email_log_model_1.default.countDocuments({ status: "sent", createdAt: { $gte: since } }),
            email_log_model_1.default.findOne({ status: "sent", createdAt: { $gte: since } }).sort({ createdAt: 1 }).select("createdAt").lean(),
            email_log_model_1.default.findOne({ limit_hit: true, createdAt: { $gte: since } }).sort({ createdAt: -1 }).select("createdAt").lean(),
            email_log_model_1.default.find({ status: "failed" }).sort({ createdAt: -1 }).limit(5).select("to subject error limit_hit createdAt").lean(),
            email_log_model_1.default.aggregate([
                { $match: { createdAt: { $gte: weekStart } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Dhaka" } },
                        sent: { $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] } },
                        failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            email_log_model_1.default.findOne().sort({ createdAt: 1 }).select("createdAt").lean(),
        ]);
        const count = (status) => { var _a; return ((_a = totals.find((row) => row._id === status)) === null || _a === void 0 ? void 0 : _a.count) || 0; };
        // TODO: after a Gmail lockout, sending resumes up to 24h after the rejection.
        const blockedUntil = lastLimitHit ? new Date(lastLimitHit.createdAt.getTime() + DAY_MS) : null;
        // TODO: a lockout means Gmail's own count (which includes manual sends) is full, whatever ours says.
        const remaining = blockedUntil ? 0 : Math.max(0, limit - sentLast24h);
        const status = blockedUntil || remaining === 0
            ? "exhausted"
            : sentLast24h >= limit * WARNING_RATIO
                ? "warning"
                : "ok";
        return {
            status,
            daily_limit: limit,
            sent_last_24h: sentLast24h,
            remaining,
            next_slot_at: oldestInWindow ? new Date(oldestInWindow.createdAt.getTime() + DAY_MS) : null,
            blocked_until: blockedUntil,
            total_sent: count("sent"),
            total_failed: count("failed"),
            counting_since: (firstLog === null || firstLog === void 0 ? void 0 : firstLog.createdAt) || null,
            daily: daily.map((row) => ({ date: row._id, sent: row.sent, failed: row.failed })),
            recent_failures: recentFailures,
        };
    }),
};
