import nodemailer from "nodemailer";
import dotenv from "dotenv";
import config from "../config";
import EmailLog from "../app/modules/email_log/email_log.model";

dotenv.config();

// TODO: a custom SMTP server when SMTP_HOST is set, otherwise the Gmail account in EMAIL_USER.
const smtpPort = Number(config.smtp_port || 587);
const auth = {
  user: config.smtp_user || config.email_user,
  pass: config.smtp_pass || config.email_pass,
};
// TODO: pooled + throttled on long-running servers; serverless instances freeze between requests, so they connect per send.
const pooling = process.env.VERCEL
  ? {}
  : { pool: true, maxConnections: 3, maxMessages: 100, rateDelta: 1000, rateLimit: 5 };

const transporter = nodemailer.createTransport(
  config.smtp_host
    ? { host: config.smtp_host, port: smtpPort, secure: smtpPort === 465, auth, ...pooling }
    : { service: "gmail", auth, ...pooling },
);

// TODO: with Gmail the From address must be the signed-in account (or a verified "Send mail as" alias), or Gmail rewrites it.
const FROM = config.email_from || `"Bibaho" <${config.email_user}>`;
const DEFAULT_REPLY_TO = config.email_reply_to || config.email_user || "bibahosupport@gmail.com";

const entities: Record<string, string> = {
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
export const htmlToText = (html: string) =>
  html
    .replace(/<(style|script|head|title)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_match, href: string, inner: string) => {
      const label = inner.replace(/<[^>]+>/g, "").trim();
      if (!label || label === href) return href;
      return href === `mailto:${label}` ? label : `${label} (${href})`;
    })
    .replace(/<\/td>\s*<td[^>]*>/gi, ": ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|tr|li|table)>/gi, "\n")
    .replace(/<\/td>/gi, "  ")
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z#0-9]+;/gi, (entity) => entities[entity] ?? entity)
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

type SendOptions = { replyTo?: string };

const buildMessage = (to: string, subject: string, html: string, options: SendOptions = {}) => {
  const replyTo = options.replyTo || DEFAULT_REPLY_TO;
  return {
    from: FROM,
    to,
    replyTo,
    subject: subject.trim(),
    html,
    text: htmlToText(html),
    // TODO: gives Gmail an "unsubscribe" link so unwanted mail gets an opt-out instead of a spam report.
    headers: { "List-Unsubscribe": `<mailto:${replyTo}?subject=unsubscribe>` },
  };
};

// TODO: Gmail answers 550 5.4.5 once the daily sending limit is used up.
const isLimitError = (error: any) =>
  /5\.4\.5|sending limit|limit exceeded/i.test(`${error?.response || ""} ${error?.message || ""}`);

const logSend = (entry: Record<string, unknown>) =>
  EmailLog.create(entry).catch((error) => console.error("Email log failed:", error?.message));

// TODO: rejects when the mail server refuses, for callers that must know it was delivered.
// TODO: every send passes here, so it is also where the admin usage counter records each one.
export const deliverEmail = async (to: string, subject: string, html: string, options?: SendOptions): Promise<void> => {
  try {
    await transporter.sendMail(buildMessage(to, subject, html, options));
  } catch (error: any) {
    await logSend({
      to,
      subject,
      status: "failed",
      error: String(error?.response || error?.message || error).slice(0, 300),
      limit_hit: isLimitError(error),
    });
    throw error;
  }
  await logSend({ to, subject, status: "sent" });
};

const sendEmail = async (to: string, subject: string, html: string, options?: SendOptions): Promise<void> => {
  try {
    await deliverEmail(to, subject, html, options);
  } catch (error: any) {
    console.error("Error sending email:", error?.message);
  }
};

// TODO: one message per recipient so addresses are never exposed to each other.
export const sendEmails = async (recipients: string[], subject: string, html: string): Promise<void> => {
  for (const recipient of recipients) {
    await sendEmail(recipient, subject, html);
  }
};

export default sendEmail;
