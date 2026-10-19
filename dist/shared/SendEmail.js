"use strict";
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmails = exports.deliverEmail = exports.htmlToText = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
const config_1 = __importDefault(require("../config"));
const email_log_model_1 = __importDefault(require("../app/modules/email_log/email_log.model"));
dotenv_1.default.config();
// TODO: a custom SMTP server when SMTP_HOST is set, otherwise the Gmail account in EMAIL_USER.
const smtpPort = Number(config_1.default.smtp_port || 587);
const auth = {
    user: config_1.default.smtp_user || config_1.default.email_user,
    pass: config_1.default.smtp_pass || config_1.default.email_pass,
};
// TODO: pooled + throttled on long-running servers; serverless instances freeze between requests, so they connect per send.
const pooling = process.env.VERCEL
    ? {}
    : { pool: true, maxConnections: 3, maxMessages: 100, rateDelta: 1000, rateLimit: 5 };
const transporter = nodemailer_1.default.createTransport(config_1.default.smtp_host
    ? Object.assign({ host: config_1.default.smtp_host, port: smtpPort, secure: smtpPort === 465, auth }, pooling) : Object.assign({ service: "gmail", auth }, pooling));
// TODO: with Gmail the From address must be the signed-in account (or a verified "Send mail as" alias), or Gmail rewrites it.
const FROM = config_1.default.email_from || `"Bibaho" <${config_1.default.email_user}>`;
const FROM_ADDRESS = (((_a = FROM.match(/<([^>]+)>/)) === null || _a === void 0 ? void 0 : _a[1]) || FROM).trim();
const DEFAULT_REPLY_TO = config_1.default.email_reply_to || config_1.default.email_user || "bibahosupport@gmail.com";
const entities = {
    "&nbsp;": " ",
    "&middot;": "·",
    "&copy;": "©",
    "&rarr;": "→",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
};
// TODO: plain-text twin of the HTML; HTML-only mail scores worse with spam filters.
const htmlToText = (html) => html
    .replace(/<(style|script|head|title)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_match, href, inner) => {
    const label = inner.replace(/<[^>]+>/g, "").trim();
    if (!label || label === href)
        return href;
    return href === `mailto:${label}` ? label : `${label} (${href})`;
})
    .replace(/<\/td>\s*<td[^>]*>/gi, ": ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|tr|li|table)>/gi, "\n")
    .replace(/<\/td>/gi, "  ")
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z#0-9]+;/gi, (entity) => { var _a; return (_a = entities[entity]) !== null && _a !== void 0 ? _a : entity; })
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
exports.htmlToText = htmlToText;
const buildMessage = (to, subject, html, options = {}) => {
    const replyTo = options.replyTo || DEFAULT_REPLY_TO;
    return {
        from: options.fromName ? { name: options.fromName, address: FROM_ADDRESS } : FROM,
        to,
        replyTo,
        subject: subject.trim(),
        html,
        text: (0, exports.htmlToText)(html),
        // TODO: gives Gmail an "unsubscribe" link so unwanted mail gets an opt-out instead of a spam report.
        headers: { "List-Unsubscribe": `<mailto:${replyTo}?subject=unsubscribe>` },
    };
};
// TODO: Gmail answers 550 5.4.5 once the daily sending limit is used up.
const isLimitError = (error) => /5\.4\.5|sending limit|limit exceeded/i.test(`${(error === null || error === void 0 ? void 0 : error.response) || ""} ${(error === null || error === void 0 ? void 0 : error.message) || ""}`);
const logSend = (entry) => email_log_model_1.default.create(entry).catch((error) => console.error("Email log failed:", error === null || error === void 0 ? void 0 : error.message));
// TODO: rejects when the mail server refuses, for callers that must know it was delivered.
// TODO: every send passes here, so it is also where the admin usage counter records each one.
const deliverEmail = (to, subject, html, options) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield transporter.sendMail(buildMessage(to, subject, html, options));
    }
    catch (error) {
        yield logSend({
            to,
            subject,
            status: "failed",
            error: String((error === null || error === void 0 ? void 0 : error.response) || (error === null || error === void 0 ? void 0 : error.message) || error).slice(0, 300),
            limit_hit: isLimitError(error),
        });
        throw error;
    }
    yield logSend({ to, subject, status: "sent" });
});
exports.deliverEmail = deliverEmail;
const sendEmail = (to, subject, html, options) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, exports.deliverEmail)(to, subject, html, options);
    }
    catch (error) {
        console.error("Error sending email:", error === null || error === void 0 ? void 0 : error.message);
    }
});
// TODO: one message per recipient so addresses are never exposed to each other.
const sendEmails = (recipients, subject, html) => __awaiter(void 0, void 0, void 0, function* () {
    for (const recipient of recipients) {
        yield sendEmail(recipient, subject, html);
    }
});
exports.sendEmails = sendEmails;
exports.default = sendEmail;
