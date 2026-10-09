import sendEmail from "./SendEmail";
import { UserInfoModel } from "../app/modules/user_info/user_info.model";
import { adminEmails } from "../app/modules/user_info/user_info.constant";
import {
  EmailBranding,
  EmailSettingsService,
} from "../app/modules/email_settings/email_settings.service";
import { DEFAULT_EMAIL_SETTINGS } from "../app/modules/email_settings/email_settings.model";
import config from "../config";

export const SITE_URL = config.client_url.replace(/\/+$/, "");

export const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export type EmailContent = {
  title: string;
  greeting?: string;
  // TODO: trusted HTML paragraphs; escape any user-provided text before passing it in.
  paragraphs: string[];
  details?: { label: string; value: unknown }[];
  action?: { label: string; path: string };
  tone?: "brand" | "success" | "warning";
};

const accent = { brand: "#0D7377", success: "#15803d", warning: "#b45309" };

export const renderEmail = (
  { title, greeting, paragraphs, details, action, tone = "brand" }: EmailContent,
  branding: EmailBranding = DEFAULT_EMAIL_SETTINGS,
) => {
  const color = accent[tone];
  const supportEmail = escapeHtml(branding.support_email);
  const social = branding.social_links
    .map((link) => `<a href="${escapeHtml(link.url)}" style="color:#0D7377;text-decoration:none;font-weight:600;">${escapeHtml(link.label)}</a>`)
    .join(' &nbsp;&middot;&nbsp; ');
  const rows = (details || [])
    .filter((row) => row.value !== undefined && row.value !== null && row.value !== "")
    .map(
      (row) => `
        <tr>
          <td style="padding:10px 14px;color:#6b7280;font-size:14px;border-bottom:1px solid #eef2f2;">${escapeHtml(row.label)}</td>
          <td style="padding:10px 14px;color:#111827;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #eef2f2;">${escapeHtml(row.value)}</td>
        </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="bn">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f3f7f7;font-family:'Hind Siliguri','Noto Sans Bengali',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f7f7;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(13,115,119,0.08);">
        <tr><td style="background:#0D7377;padding:20px 28px;">
          <a href="${SITE_URL}" style="display:inline-block;color:#ffffff;font-size:22px;font-weight:700;text-decoration:none;">
            <img src="${escapeHtml(branding.logo_url)}" alt="Bibaho" height="44" style="display:block;height:44px;width:auto;border:0;outline:none;color:#ffffff;font-size:22px;font-weight:700;">
          </a>
          <div style="color:#cdeceb;font-size:12px;margin-top:6px;">বিশ্বস্ত বাংলাদেশি ম্যাট্রিমনি প্ল্যাটফর্ম</div>
        </td></tr>
        <tr><td style="height:4px;background:${color};line-height:4px;font-size:0;">&nbsp;</td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 16px;color:#111827;font-size:20px;line-height:1.4;">${escapeHtml(title)}</h1>
          ${greeting ? `<p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.7;">${escapeHtml(greeting)}</p>` : ""}
          ${paragraphs.map((p) => `<p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.7;">${p}</p>`).join("")}
          ${rows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;border:1px solid #eef2f2;border-radius:12px;border-collapse:separate;overflow:hidden;">${rows}</table>` : ""}
          ${action ? `<div style="margin:24px 0 8px;"><a href="${SITE_URL}${action.path}" style="display:inline-block;background:#0D7377;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">${escapeHtml(action.label)}</a></div>` : ""}
        </td></tr>
        <tr><td style="padding:18px 28px;background:#f8fbfb;border-top:1px solid #eef2f2;color:#6b7280;font-size:12px;line-height:1.7;">
          ${social ? `<div style="margin-bottom:10px;font-size:13px;">${social}</div>` : ""}
          কোনো প্রশ্ন থাকলে যোগাযোগ করুন: <a href="mailto:${supportEmail}" style="color:#0D7377;">${supportEmail}</a><br>
          &copy; ${new Date().getFullYear()} Bibaho &middot; <a href="${SITE_URL}" style="color:#0D7377;text-decoration:none;">bibaho.org</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

// TODO: fire-and-forget so slow or failing Gmail never delays or breaks the request.
export const mailUser = (to: string | undefined | null, subject: string, content: EmailContent) => {
  if (!to) return;
  EmailSettingsService.get()
    .then((branding) => sendEmail(to, `${subject} | Bibaho`, renderEmail(content, branding)))
    .catch((error) => console.error("Email send failed:", error));
};

export const mailAdmins = (subject: string, content: EmailContent) => {
  adminEmails.forEach((to) => mailUser(to, subject, content));
};

export const mailUserById = (userId: unknown, subject: string, content: EmailContent) => {
  if (!userId) return;
  UserInfoModel.findById(String(userId))
    .select("email")
    .lean()
    .then((user: any) => mailUser(user?.email, subject, content))
    .catch((error) => console.error("Email recipient lookup failed:", error));
};

export const formatTaka =(amount: unknown) => `৳${Number(amount || 0).toLocaleString("en-US")}`;
