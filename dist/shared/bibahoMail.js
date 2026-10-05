"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTaka = exports.mailUserById = exports.mailAdmins = exports.mailUser = exports.renderEmail = exports.escapeHtml = exports.SITE_URL = void 0;
const SendEmail_1 = __importDefault(require("./SendEmail"));
const user_info_model_1 = require("../app/modules/user_info/user_info.model");
const user_info_constant_1 = require("../app/modules/user_info/user_info.constant");
const email_settings_service_1 = require("../app/modules/email_settings/email_settings.service");
const email_settings_model_1 = require("../app/modules/email_settings/email_settings.model");
exports.SITE_URL = "https://www.bibaho.org";
const escapeHtml = (value) => String(value !== null && value !== void 0 ? value : "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
exports.escapeHtml = escapeHtml;
const accent = { brand: "#0D7377", success: "#15803d", warning: "#b45309" };
const renderEmail = ({ title, greeting, paragraphs, details, action, tone = "brand" }, branding = email_settings_model_1.DEFAULT_EMAIL_SETTINGS) => {
    const color = accent[tone];
    const supportEmail = (0, exports.escapeHtml)(branding.support_email);
    const social = branding.social_links
        .map((link) => `<a href="${(0, exports.escapeHtml)(link.url)}" style="color:#0D7377;text-decoration:none;font-weight:600;">${(0, exports.escapeHtml)(link.label)}</a>`)
        .join(' &nbsp;&middot;&nbsp; ');
    const rows = (details || [])
        .filter((row) => row.value !== undefined && row.value !== null && row.value !== "")
        .map((row) => `
        <tr>
          <td style="padding:10px 14px;color:#6b7280;font-size:14px;border-bottom:1px solid #eef2f2;">${(0, exports.escapeHtml)(row.label)}</td>
          <td style="padding:10px 14px;color:#111827;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #eef2f2;">${(0, exports.escapeHtml)(row.value)}</td>
        </tr>`)
        .join("");
    return `<!DOCTYPE html>
<html lang="bn">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${(0, exports.escapeHtml)(title)}</title></head>
<body style="margin:0;padding:0;background:#f3f7f7;font-family:'Hind Siliguri','Noto Sans Bengali',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f7f7;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(13,115,119,0.08);">
        <tr><td style="background:#0D7377;padding:20px 28px;">
          <a href="${exports.SITE_URL}" style="display:inline-block;color:#ffffff;font-size:22px;font-weight:700;text-decoration:none;">
            <img src="${(0, exports.escapeHtml)(branding.logo_url)}" alt="Bibaho" height="44" style="display:block;height:44px;width:auto;border:0;outline:none;color:#ffffff;font-size:22px;font-weight:700;">
          </a>
          <div style="color:#cdeceb;font-size:12px;margin-top:6px;">বিশ্বস্ত বাংলাদেশি ম্যাট্রিমনি প্ল্যাটফর্ম</div>
        </td></tr>
        <tr><td style="height:4px;background:${color};line-height:4px;font-size:0;">&nbsp;</td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 16px;color:#111827;font-size:20px;line-height:1.4;">${(0, exports.escapeHtml)(title)}</h1>
          ${greeting ? `<p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.7;">${(0, exports.escapeHtml)(greeting)}</p>` : ""}
          ${paragraphs.map((p) => `<p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.7;">${p}</p>`).join("")}
          ${rows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;border:1px solid #eef2f2;border-radius:12px;border-collapse:separate;overflow:hidden;">${rows}</table>` : ""}
          ${action ? `<div style="margin:24px 0 8px;"><a href="${exports.SITE_URL}${action.path}" style="display:inline-block;background:#0D7377;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">${(0, exports.escapeHtml)(action.label)}</a></div>` : ""}
        </td></tr>
        <tr><td style="padding:18px 28px;background:#f8fbfb;border-top:1px solid #eef2f2;color:#6b7280;font-size:12px;line-height:1.7;">
          ${social ? `<div style="margin-bottom:10px;font-size:13px;">${social}</div>` : ""}
          কোনো প্রশ্ন থাকলে যোগাযোগ করুন: <a href="mailto:${supportEmail}" style="color:#0D7377;">${supportEmail}</a><br>
          &copy; ${new Date().getFullYear()} Bibaho &middot; <a href="${exports.SITE_URL}" style="color:#0D7377;text-decoration:none;">bibaho.org</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};
exports.renderEmail = renderEmail;
// TODO: fire-and-forget so slow or failing Gmail never delays or breaks the request.
const mailUser = (to, subject, content) => {
    if (!to)
        return;
    email_settings_service_1.EmailSettingsService.get()
        .then((branding) => (0, SendEmail_1.default)(to, `${subject} | Bibaho`, (0, exports.renderEmail)(content, branding)))
        .catch((error) => console.error("Email send failed:", error));
};
exports.mailUser = mailUser;
const mailAdmins = (subject, content) => {
    user_info_constant_1.adminEmails.forEach((to) => (0, exports.mailUser)(to, subject, content));
};
exports.mailAdmins = mailAdmins;
const mailUserById = (userId, subject, content) => {
    if (!userId)
        return;
    user_info_model_1.UserInfoModel.findById(String(userId))
        .select("email")
        .lean()
        .then((user) => (0, exports.mailUser)(user === null || user === void 0 ? void 0 : user.email, subject, content))
        .catch((error) => console.error("Email recipient lookup failed:", error));
};
exports.mailUserById = mailUserById;
const formatTaka = (amount) => `৳${Number(amount || 0).toLocaleString("en-US")}`;
exports.formatTaka = formatTaka;
