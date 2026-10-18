import sendEmail, { deliverEmail } from "./SendEmail";
import { UserInfoModel } from "../app/modules/user_info/user_info.model";
import { adminEmails } from "../app/modules/user_info/user_info.constant";
import {
  EmailBranding,
  EmailSettingsService,
} from "../app/modules/email_settings/email_settings.service";
import { DEFAULT_EMAIL_SETTINGS } from "../app/modules/email_settings/email_settings.model";
import config from "../config";

export const SITE_URL = config.client_url.replace(/\/+$/, "");
// TODO: icons are PNGs served by biye-front (public/email); Gmail does not render SVG.
const ASSETS = config.email_asset_url.replace(/\/+$/, "");
// TODO: bump when icons change; Gmail's image proxy caches each URL, including earlier 404s.
const ASSET_VERSION = "2";
const asset = (file: string) => `${ASSETS}/${file}.png?v=${ASSET_VERSION}`;

export const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
export const toBanglaDigits = (value: unknown) => String(value ?? "").replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

// TODO: Figma "Bibaho — Email Templates" tokens.
const C = {
  teal: "#0d7377",
  teal50: "#eaf5f5",
  rose300: "#f6a6b5",
  rose100: "#f8dde5",
  rose50: "#fdf2f5",
  rose700: "#b4466a",
  gold: "#b8862b",
  gold50: "#fbf4e4",
  ink900: "#18292d",
  ink600: "#4a5c61",
  ink400: "#83969a",
  line: "#e1eaea",
  surface: "#f7f9f9",
  success: "#18794e",
  successBg: "#e5f4ec",
  danger: "#c0392b",
  dangerBg: "#fcebe9",
};
const FONT = "'Hind Siliguri','Noto Sans Bengali',Arial,sans-serif";
const SERIF = "'Noto Serif Bengali','Hind Siliguri',serif";
const LATIN = "Montserrat,Arial,sans-serif";

export type EmailTone = "brand" | "success" | "warning" | "danger" | "rose";

// TODO: hero badge presets; each icon is baked in its tone's colour.
const HEROES = {
  welcome: { file: "hero-heart-rose", tone: "rose" },
  heart: { file: "hero-heart-teal", tone: "brand" },
  key: { file: "hero-key", tone: "brand" },
  clock: { file: "hero-clock", tone: "warning" },
  check: { file: "hero-check", tone: "success" },
  edit: { file: "hero-file-edit", tone: "danger" },
  request: { file: "hero-message-heart", tone: "rose" },
  bell: { file: "hero-bell", tone: "warning" },
  coins: { file: "hero-coins", tone: "success" },
  refund: { file: "hero-refund", tone: "success" },
  support: { file: "hero-headset", tone: "brand" },
} as const;
export type EmailIcon = keyof typeof HEROES;

const TONES: Record<EmailTone, { bg: string; fg: string; icon: EmailIcon }> = {
  brand: { bg: C.teal50, fg: C.teal, icon: "heart" },
  rose: { bg: C.rose100, fg: C.rose700, icon: "welcome" },
  warning: { bg: C.gold50, fg: C.gold, icon: "bell" },
  success: { bg: C.successBg, fg: C.success, icon: "check" },
  danger: { bg: C.dangerBg, fg: C.danger, icon: "edit" },
};

export type EmailAction = { label: string; path?: string; url?: string; outline?: boolean; arrow?: boolean };
type Row = { label: string; value: unknown };

// TODO: html/items fields are trusted HTML; escape user text before passing it in. Everything else is escaped here.
export type EmailBlock =
  | { type: "text"; html: string }
  | { type: "label"; text: string }
  | { type: "info"; title?: string; rows: Row[]; total?: Row }
  | { type: "notice"; title: string; text: string }
  | { type: "checklist"; title?: string; items: string[]; mark?: "check" | "cross" }
  | { type: "steps"; title?: string; items: string[] }
  | { type: "progress"; stages: string[]; current: number }
  | { type: "biodata"; id: unknown; gender?: string; summary?: string; detail?: string; path?: string }
  | { type: "stat"; label: string; value: unknown; unit?: string }
  | { type: "quote"; text: string; source?: string }
  | { type: "message"; label: string; text: string }
  | { type: "buttons"; actions: EmailAction[] }
  | { type: "note"; html: string }
  | { type: "link"; label: string; url: string };

export type EmailContent = {
  title: string;
  eyebrow?: string;
  icon?: EmailIcon;
  tone?: EmailTone;
  // TODO: inbox preview line; defaults to the first paragraph.
  preheader?: string;
  // TODO: renders "প্রিয় <name>,"; greeting is the free-form alternative.
  name?: string;
  greeting?: string;
  // TODO: trusted HTML paragraphs; escape any user-provided text before passing it in.
  paragraphs?: string[];
  blocks?: EmailBlock[];
  details?: Row[];
  detailsTitle?: string;
  action?: EmailAction;
  // TODO: footer "why you got this" line.
  reason?: string;
};

const DEFAULT_REASON = "আপনি এই ইমেইলটি পাচ্ছেন কারণ আপনি বিয়ে (bibaho.org)-এ একটি অ্যাকাউন্ট খুলেছেন।";
const ADMIN_REASON = "আপনি বিয়ে-র অ্যাডমিন হিসেবে এই ইমেইলটি পাচ্ছেন।";

const img = (file: string, w: number, h: number, extra = "") =>
  `<img src="${asset(file)}" width="${w}" height="${h}" alt="" style="display:block;width:${w}px;height:${h}px;border:0;outline:none;${extra}">`;
const strong = (html: string, color = C.ink900) =>
  html.replace(/<strong>/g, `<strong style="color:${color};font-weight:600;">`);
const hrefOf = (action: EmailAction) => escapeHtml(action.url || `${SITE_URL}${action.path || ""}`);
const filled = (rows: Row[]) => rows.filter((row) => row.value !== undefined && row.value !== null && row.value !== "");

const logo = (onDark: boolean) => {
  const color = onDark ? "#ffffff" : C.teal;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>
    <td style="padding:0 10px 0 0;vertical-align:middle;">${img(onDark ? "rings-dark" : "rings-light", 50, 32)}</td>
    <td style="padding:0;vertical-align:middle;"><div style="width:1px;height:32px;background:${color};opacity:0.35;"></div></td>
    <td style="padding:0 0 0 10px;vertical-align:middle;white-space:nowrap;">
      <div style="font-family:${SERIF};font-size:26px;line-height:34px;font-weight:700;letter-spacing:0.52px;color:${color};">বিয়ে</div>
      <div style="font-family:${LATIN};font-size:8px;line-height:10px;font-weight:600;letter-spacing:3.2px;color:${color};opacity:0.85;">MATRIMONY</div>
    </td>
  </tr></table>`;
};

const header = (branding: EmailBranding) => `
  <tr><td style="background:${C.teal};padding:22px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:middle;"><a href="${SITE_URL}" style="text-decoration:none;">${
        branding.logo_url
          ? `<img src="${escapeHtml(branding.logo_url)}" alt="বিয়ে" height="44" style="display:block;height:44px;width:auto;border:0;">`
          : logo(true)
      }</a></td>
      <td align="right" style="vertical-align:middle;font-family:${FONT};font-size:12px;line-height:18px;font-weight:500;color:#ffffff;opacity:0.85;padding-left:12px;">বাংলাদেশের বিশ্বস্ত<br>অনলাইন ম্যাট্রিমনি</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="height:4px;background:${C.rose300};font-size:0;line-height:4px;">&nbsp;</td>
    <td width="120" style="width:120px;height:4px;background:${C.gold};font-size:0;line-height:4px;">&nbsp;</td>
    <td style="height:4px;background:${C.rose300};font-size:0;line-height:4px;">&nbsp;</td>
  </tr></table></td></tr>`;

const SOCIAL_ICONS: Record<string, string> = { facebook: "facebook", linkedin: "linkedin", whatsapp: "whatsapp" };

const footer = (branding: EmailBranding, reason: string) => {
  const support = escapeHtml(branding.support_email);
  const phone = escapeHtml(branding.support_phone);
  const inlineIcon = (file: string) =>
    `<img src="${asset(file)}" width="16" height="16" alt="" style="display:inline-block;width:16px;height:16px;border:0;vertical-align:-3px;margin-right:6px;">`;
  // TODO: inline-blocks so phone and email stack on narrow screens instead of overflowing.
  const contact = [
    phone ? `<span style="display:inline-block;margin:0 10px;white-space:nowrap;">${inlineIcon("phone")}${phone}</span>` : "",
    `<span style="display:inline-block;margin:0 10px;white-space:nowrap;">${inlineIcon("mail")}<a href="mailto:${support}" style="color:${C.ink600};text-decoration:none;">${support}</a></span>`,
  ].join("");
  const social = branding.social_links
    .map((link) => {
      const icon = SOCIAL_ICONS[link.label.trim().toLowerCase()];
      const body = icon
        ? `<a href="${escapeHtml(link.url)}" style="display:block;width:36px;height:36px;border-radius:18px;background:${C.teal50};text-decoration:none;"><table role="presentation" width="36" height="36" cellpadding="0" cellspacing="0"><tr><td align="center" valign="middle">${img(icon, 16, 16)}</td></tr></table></a>`
        : `<a href="${escapeHtml(link.url)}" style="display:inline-block;padding:7px 12px;border-radius:18px;background:${C.teal50};color:${C.teal};font-family:${FONT};font-size:12px;line-height:22px;font-weight:600;text-decoration:none;">${escapeHtml(link.label)}</a>`;
      return `<td style="padding:0 5px;">${body}</td>`;
    })
    .join("");
  const legal = [
    ["গোপনীয়তা নীতিমালা", `${SITE_URL}/privacy-policy`],
    ["শর্তাবলি", `${SITE_URL}/terms-and-condition`],
    ["রিফান্ড নীতিমালা", `${SITE_URL}/refund-policy`],
    ["আনসাবস্ক্রাইব", `mailto:${support}?subject=unsubscribe`],
  ]
    .map(([label, href]) => `<a href="${href}" style="color:${C.teal};text-decoration:none;">${label}</a>`)
    .join(" &nbsp;&nbsp;&bull;&nbsp;&nbsp; ");
  const caption = `font-family:${FONT};font-size:12px;line-height:18px;font-weight:500;`;

  return `<tr><td align="center" style="background:${C.surface};padding:32px;">
    <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr><td>${logo(false)}</td></tr></table>
    <div style="padding-top:16px;font-family:${FONT};font-size:14px;line-height:22px;font-weight:600;color:${C.ink900};">কোনো প্রশ্ন আছে? আমরা আপনার পাশে আছি</div>
    <div style="padding-top:12px;font-family:${FONT};font-size:14px;line-height:30px;color:${C.ink600};">${contact}</div>
    ${social ? `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin-top:16px;"><tr>${social}</tr></table>` : ""}
    <div style="margin-top:16px;height:1px;background:${C.line};font-size:0;line-height:1px;">&nbsp;</div>
    <div style="padding-top:16px;${caption}">${legal}</div>
    <div style="padding-top:16px;${caption}color:${C.ink400};">${escapeHtml(reason)}</div>
    <div style="padding-top:16px;${caption}color:${C.ink400};">&copy; ২০২৩–${toBanglaDigits(new Date().getFullYear())} বিয়ে &middot; বাংলাদেশী ম্যাট্রিমনি প্ল্যাটফর্ম &middot; ঢাকা, বাংলাদেশ</div>
  </td></tr>`;
};

const infoTable = (title: string | undefined, rows: Row[], total?: Row) => {
  const list = filled(rows);
  const cell = `font-family:${FONT};font-size:14px;line-height:22px;padding:12px 0;`;
  const body = list
    .map((row, i) => {
      const border = i < list.length - 1 ? `border-bottom:1px solid ${C.line};` : "";
      return `<tr>
        <td style="${cell}${border}color:${C.ink600};">${escapeHtml(row.label)}</td>
        <td align="right" style="${cell}${border}color:${C.ink900};font-weight:600;text-align:right;">${escapeHtml(row.value)}</td>
      </tr>`;
    })
    .join("");
  const totalRow = total
    ? `<tr>
        <td style="font-family:${FONT};font-size:16px;line-height:28px;font-weight:600;color:${C.ink900};padding:14px 0;border-top:1.5px solid ${C.ink900};">${escapeHtml(total.label)}</td>
        <td align="right" style="font-family:${FONT};font-size:18px;line-height:28px;font-weight:600;color:${C.teal};padding:14px 0;border-top:1.5px solid ${C.ink900};text-align:right;">${escapeHtml(total.value)}</td>
      </tr>`
    : "";
  if (!body && !totalRow) return "";
  return `<div style="border:1px solid ${C.line};border-radius:14px;padding:16px 20px ${total ? 8 : 4}px;background:#ffffff;">
    ${title ? `<div style="font-family:${FONT};font-size:14px;line-height:22px;font-weight:600;color:${C.teal};padding-bottom:4px;">${escapeHtml(title)}</div>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${body}${totalRow}</table>
  </div>`;
};

const panelTitle = (title?: string) =>
  title ? `<div style="font-family:${FONT};font-size:18px;line-height:28px;font-weight:600;color:${C.ink900};">${escapeHtml(title)}</div>` : "";

const button = (action: EmailAction) => {
  const outline = !!action.outline;
  const arrow = action.arrow ?? !outline;
  const style = outline
    ? `background:#ffffff;border:1.5px solid ${C.teal};color:${C.teal};padding:12.5px 26.5px;`
    : `background:${C.teal};border:0;color:#ffffff;padding:14px 28px;`;
  const icon = arrow
    ? `<img src="${asset(outline ? "arrow-teal" : "arrow-white")}" width="18" height="18" alt="" style="display:inline-block;width:18px;height:18px;border:0;vertical-align:-3px;margin-left:8px;">`
    : "";
  return `<a href="${hrefOf(action)}" style="display:inline-block;${style}border-radius:10px;font-family:${FONT};font-size:16px;line-height:24px;font-weight:600;text-decoration:none;margin:0 12px 12px 0;">${escapeHtml(action.label)}${icon}</a>`;
};

const progress = (stages: string[], current: number) => {
  const cells: string[] = [];
  stages.forEach((label, i) => {
    const done = i < current;
    const active = i === current;
    const badge = done
      ? `<div style="width:32px;height:32px;border-radius:16px;background:${C.teal};"><table role="presentation" width="32" height="32" cellpadding="0" cellspacing="0"><tr><td align="center" valign="middle">${img("check-white", 16, 16)}</td></tr></table></div>`
      : active
        ? `<div style="width:28px;height:28px;border-radius:16px;background:${C.gold50};border:2px solid ${C.gold};"><table role="presentation" width="28" height="28" cellpadding="0" cellspacing="0"><tr><td align="center" valign="middle">${img("clock-gold-sm", 16, 16)}</td></tr></table></div>`
        : `<div style="width:32px;height:32px;border-radius:16px;background:${C.line};text-align:center;font-family:${FONT};font-size:14px;line-height:32px;font-weight:600;color:${C.ink400};">${toBanglaDigits(i + 1)}</div>`;
    cells.push(`<td width="104" align="center" valign="top" style="width:104px;">
      <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr><td>${badge}</td></tr></table>
      <div style="padding-top:8px;font-family:${FONT};font-size:12px;line-height:18px;font-weight:500;color:${done || active ? C.ink900 : C.ink400};">${escapeHtml(label)}</div>
    </td>`);
    if (i < stages.length - 1) {
      cells.push(`<td valign="top" style="padding-top:15px;"><div style="height:2px;background:${i < current ? C.teal : C.line};font-size:0;line-height:2px;">&nbsp;</div></td>`);
    }
  });
  return `<div style="background:${C.surface};border-radius:14px;padding:20px 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${cells.join("")}</tr></table></div>`;
};

const biodataCard = (block: Extract<EmailBlock, { type: "biodata" }>) => {
  const female = /female|মহিলা|পাত্রী/i.test(String(block.gender || ""));
  const male = !female && /male|পুরুষ|পাত্র/i.test(String(block.gender || ""));
  const chip = female
    ? `<span style="display:inline-block;margin-left:8px;padding:1px 8px;border-radius:20px;background:${C.rose50};color:${C.danger};font-size:12px;line-height:18px;font-weight:500;">পাত্রী</span>`
    : male
      ? `<span style="display:inline-block;margin-left:8px;padding:1px 8px;border-radius:20px;background:${C.teal50};color:${C.teal};font-size:12px;line-height:18px;font-weight:500;">পাত্র</span>`
      : "";
  const href = hrefOf({ label: "", path: block.path || `/biodata/${block.id}` });
  return `<a href="${href}" style="display:block;text-decoration:none;border:1px solid ${C.line};border-radius:14px;padding:16px 20px 16px 16px;background:#ffffff;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="56" valign="middle" style="width:56px;"><div style="width:56px;height:56px;border-radius:28px;background:${female ? C.rose100 : C.teal50};"><table role="presentation" width="56" height="56" cellpadding="0" cellspacing="0"><tr><td align="center" valign="middle">${img(female ? "user-rose" : "user-teal", 26, 26)}</td></tr></table></div></td>
      <td valign="middle" style="padding-left:14px;font-family:${FONT};">
        <div style="font-size:14px;line-height:22px;font-weight:600;color:${C.ink900};">বায়োডাটা নং: ${escapeHtml(block.id)}${chip}</div>
        ${block.summary ? `<div style="font-size:14px;line-height:22px;color:${C.ink600};padding-top:2px;">${escapeHtml(block.summary)}</div>` : ""}
        ${block.detail ? `<div style="font-size:12px;line-height:18px;font-weight:500;color:${C.ink400};padding-top:2px;">${escapeHtml(block.detail)}</div>` : ""}
      </td>
      <td align="right" valign="middle" style="padding-left:12px;white-space:nowrap;font-family:${FONT};font-size:14px;line-height:22px;font-weight:600;color:${C.teal};">দেখুন <img src="${asset("arrow-teal-sm")}" width="16" height="16" alt="" style="display:inline-block;width:16px;height:16px;border:0;vertical-align:-3px;margin-left:4px;"></td>
    </tr></table>
  </a>`;
};

const renderBlock = (block: EmailBlock): string => {
  const small = `font-family:${FONT};font-size:14px;line-height:22px;`;
  switch (block.type) {
    case "text":
      return `<p style="margin:0;font-family:${FONT};font-size:16px;line-height:28px;color:${C.ink600};">${strong(block.html)}</p>`;
    case "label":
      return `<div style="font-family:${FONT};font-size:13px;line-height:20px;font-weight:600;letter-spacing:0.52px;color:${C.ink400};">${escapeHtml(block.text)}</div>`;
    case "info":
      return infoTable(block.title, block.rows, block.total);
    case "notice":
      return `<div style="background:${C.teal50};border-radius:12px;padding:16px 18px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td width="20" valign="top" style="width:20px;padding-top:1px;">${img("info", 20, 20)}</td>
        <td valign="top" style="padding-left:12px;${small}">
          <div style="font-weight:600;color:${C.teal};">${escapeHtml(block.title)}</div>
          <div style="color:${C.ink600};padding-top:2px;">${escapeHtml(block.text)}</div>
        </td>
      </tr></table></div>`;
    case "checklist": {
      const cross = block.mark === "cross";
      const items = block.items
        .map(
          (item) => `<tr><td width="22" valign="top" style="width:22px;padding-top:12px;"><div style="width:22px;height:22px;border-radius:11px;background:${cross ? C.dangerBg : C.successBg};"><table role="presentation" width="22" height="22" cellpadding="0" cellspacing="0"><tr><td align="center" valign="middle">${img(cross ? "x-danger" : "check-success", 13, 13)}</td></tr></table></div></td>
          <td valign="top" style="padding:12px 0 0 10px;${small}color:${C.ink600};">${strong(item)}</td></tr>`,
        )
        .join("");
      return `<div style="background:${C.surface};border-radius:14px;padding:${block.title ? 20 : 8}px 20px 20px;">${panelTitle(block.title)}<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table></div>`;
    }
    case "steps": {
      const items = block.items
        .map(
          (item, i) => `<tr><td width="28" valign="top" style="width:28px;padding-top:14px;"><div style="width:28px;height:28px;border-radius:14px;background:${C.teal};text-align:center;font-family:${FONT};font-size:14px;line-height:28px;font-weight:600;color:#ffffff;">${toBanglaDigits(i + 1)}</div></td>
          <td valign="top" style="padding:14px 0 0 12px;${small}color:${C.ink600};">${strong(item)}</td></tr>`,
        )
        .join("");
      return `<div style="background:${C.surface};border-radius:14px;padding:20px;">${panelTitle(block.title)}<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table></div>`;
    }
    case "progress":
      return progress(block.stages, block.current);
    case "biodata":
      return biodataCard(block);
    case "stat":
      return `<div style="background:${C.teal50};border-radius:14px;padding:24px;text-align:center;">
        <div style="${small}color:${C.ink600};">${escapeHtml(block.label)}</div>
        <div style="padding-top:2px;white-space:nowrap;"><span style="font-family:${LATIN};font-size:40px;line-height:48px;font-weight:700;color:${C.teal};">${escapeHtml(block.value)}</span>${
          block.unit ? `<span style="font-family:${FONT};font-size:16px;line-height:28px;font-weight:600;color:${C.ink600};margin-left:8px;">${escapeHtml(block.unit)}</span>` : ""
        }</div>
      </div>`;
    case "quote":
      return `<div style="background:${C.rose50};border-radius:14px;padding:20px 28px 24px;text-align:center;">
        <div style="font-family:${LATIN};font-size:40px;line-height:48px;font-weight:700;color:${C.rose300};">&ldquo;</div>
        <div style="padding-top:6px;font-family:${FONT};font-size:16px;line-height:28px;font-weight:600;color:${C.ink900};">${escapeHtml(block.text)}</div>
        ${block.source ? `<div style="padding-top:6px;font-family:${FONT};font-size:12px;line-height:18px;font-weight:500;color:${C.rose700};">— ${escapeHtml(block.source)}</div>` : ""}
      </div>`;
    case "message":
      return `<div style="background:${C.surface};border-radius:12px;padding:16px 20px;">
        <div style="font-family:${FONT};font-size:12px;line-height:18px;font-weight:500;color:${C.ink400};">${escapeHtml(block.label)}</div>
        <div style="padding-top:4px;${small}color:${C.ink600};">${escapeHtml(block.text).replace(/\n/g, "<br>")}</div>
      </div>`;
    case "buttons":
      return block.actions.length ? `<div style="font-size:0;line-height:0;margin-bottom:-12px;">${block.actions.map(button).join("")}</div>` : "";
    case "note":
      return `<p style="margin:0;${small}color:${C.ink400};">${strong(block.html, C.ink600)}</p>`;
    case "link":
      return `<div style="font-family:${FONT};font-size:12px;line-height:18px;font-weight:500;">
        <div style="color:${C.ink400};">${escapeHtml(block.label)}</div>
        <a href="${escapeHtml(block.url)}" style="color:${C.teal};text-decoration:underline;word-break:break-all;">${escapeHtml(block.url)}</a>
      </div>`;
  }
};

export const renderEmail = (content: EmailContent, branding: EmailBranding = DEFAULT_EMAIL_SETTINGS) => {
  const { title, eyebrow, name, greeting, paragraphs = [], blocks = [], details, detailsTitle, action } = content;
  const tone = TONES[content.tone || (content.icon ? HEROES[content.icon].tone : "brand")];
  const hero = HEROES[content.icon || tone.icon];
  const badge = TONES[hero.tone as EmailTone];
  const preview = (content.preheader || paragraphs[0] || title).replace(/<[^>]+>/g, "").slice(0, 140);
  const body: EmailBlock[] = [
    ...paragraphs.map((html): EmailBlock => ({ type: "text", html })),
    ...blocks,
    ...(details?.length ? [{ type: "info", title: detailsTitle, rows: details } as EmailBlock] : []),
    ...(action ? [{ type: "buttons", actions: [action] } as EmailBlock] : []),
  ];
  const salutation = name
    ? `প্রিয় <strong>${escapeHtml(name)}</strong>,`
    : greeting
      ? escapeHtml(greeting)
      : "";
  const sections = [
    salutation && renderBlock({ type: "text", html: salutation }),
    ...body.map(renderBlock),
    `<div style="font-family:${FONT};font-size:16px;line-height:28px;"><div style="color:${C.ink600};">শুভকামনায়,</div><div style="color:${C.ink900};font-weight:600;">টিম বিয়ে</div></div>`,
  ].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="x-apple-disable-message-reformatting">
<title>${escapeHtml(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Montserrat:wght@600;700&family=Noto+Serif+Bengali:wght@700&display=swap" rel="stylesheet">
<style>@media (max-width:620px){.bb-pad{padding:32px 20px!important}.bb-title{font-size:24px!important;line-height:34px!important}}</style>
</head>
<body style="margin:0;padding:0;background:#eef3f3;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(preview)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef3f3;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 32px rgba(13,77,82,0.1);">
        ${header(branding)}
        <tr><td class="bb-pad" style="padding:40px 32px;">
          <div style="width:64px;height:64px;border-radius:32px;background:${badge.bg};"><table role="presentation" width="64" height="64" cellpadding="0" cellspacing="0"><tr><td align="center" valign="middle">${img(hero.file, 30, 30)}</td></tr></table></div>
          ${eyebrow ? `<div style="padding-top:16px;font-family:${FONT};font-size:13px;line-height:20px;font-weight:600;letter-spacing:0.52px;color:${tone.fg};">${escapeHtml(eyebrow)}</div>` : ""}
          <h1 class="bb-title" style="margin:${eyebrow ? 4 : 16}px 0 0;font-family:${FONT};font-size:28px;line-height:40px;font-weight:700;color:${C.ink900};">${escapeHtml(title)}</h1>
          ${sections.map((html) => `<div style="padding-top:22px;">${html}</div>`).join("")}
        </td></tr>
        ${footer(branding, content.reason || DEFAULT_REASON)}
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
    .then((branding) =>
      sendEmail(to, `${subject} | Bibaho`, renderEmail(content, branding), { replyTo: branding.support_email }),
    )
    .catch((error) => console.error("Email send failed:", error));
};

// TODO: awaited version of mailUser that rejects when the email could not be sent.
export const mailUserNow = async (to: string, subject: string, content: EmailContent) => {
  const branding = await EmailSettingsService.get();
  await deliverEmail(to, `${subject} | Bibaho`, renderEmail(content, branding), { replyTo: branding.support_email });
};

export const mailAdmins = (subject: string, content: EmailContent) => {
  adminEmails.forEach((to) => mailUser(to, subject, { reason: ADMIN_REASON, ...content }));
};

type Recipient = { username?: string; user_id?: unknown };

// TODO: looks the user up once, then builds the email from their name and biodata number.
export const mailUserByIdWith = (userId: unknown, build: (user: Recipient) => { subject: string; content: EmailContent }) => {
  if (!userId) return;
  UserInfoModel.findById(String(userId))
    .select("email username user_id")
    .lean()
    .then((user: any) => {
      if (!user?.email) return;
      const { subject, content } = build({ username: user.username || undefined, user_id: user.user_id });
      mailUser(user.email, subject, content);
    })
    .catch((error) => console.error("Email recipient lookup failed:", error));
};

export const mailUserById = (userId: unknown, subject: string, content: EmailContent) =>
  mailUserByIdWith(userId, (user) => ({ subject, content: { name: user.username, ...content } }));

export const formatTaka = (amount: unknown) => `৳${Number(amount || 0).toLocaleString("en-US")}`;
