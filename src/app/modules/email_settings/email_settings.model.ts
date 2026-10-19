import mongoose, { Document, Schema } from "mongoose";

export type SocialLink = { label: string; url: string };

export interface IEmailSettings extends Document {
  key: string;
  logo_url: string;
  support_email: string;
  support_phone: string;
  social_links: SocialLink[];
  footer_links: SocialLink[];
  sender_name: string;
  disabled_templates: string[];
  daily_limit: number;
}

// TODO: Gmail allows ~500 recipients per rolling 24h; Google Workspace allows 2000.
export const DEFAULT_DAILY_EMAIL_LIMIT = 500;

// TODO: the old default header logo; treated as "no override" so existing installs get the Figma logo.
export const LEGACY_LOGO_URL = "https://res.cloudinary.com/dfcyydhfn/image/upload/v1791121207/logo_vmmj9g.png";

export const DEFAULT_EMAIL_SETTINGS = {
  // TODO: empty means the built-in বিবাহ logo header.
  logo_url: "",
  support_email: "bibahosupport@gmail.com",
  support_phone: "+880 1793-278360",
  social_links: [] as SocialLink[],
  // TODO: footer legal links; a leading "/" means a page on CLIENT_URL.
  footer_links: [
    { label: "গোপনীয়তা নীতিমালা", url: "/privacy-policy" },
    { label: "শর্তাবলি", url: "/terms-and-condition" },
    { label: "রিফান্ড নীতিমালা", url: "/refund-policy" },
  ] as SocialLink[],
  // TODO: display name only; the From address stays in .env so the admin panel never holds mail credentials.
  sender_name: "Bibaho",
  disabled_templates: [] as string[],
};

// TODO: account-recovery mail the admin must not be able to switch off.
export const LOCKED_TEMPLATES = ["passwordReset"];

// TODO: single document (key "default") with the branding every email uses.
const EmailSettingsSchema = new Schema<IEmailSettings>(
  {
    key: { type: String, default: "default", unique: true },
    logo_url: { type: String, default: DEFAULT_EMAIL_SETTINGS.logo_url },
    support_email: { type: String, default: DEFAULT_EMAIL_SETTINGS.support_email },
    support_phone: { type: String, default: DEFAULT_EMAIL_SETTINGS.support_phone },
    social_links: {
      type: [{ _id: false, label: { type: String, required: true }, url: { type: String, required: true } }],
      default: [],
    },
    footer_links: {
      type: [{ _id: false, label: { type: String, required: true }, url: { type: String, required: true } }],
      default: () => DEFAULT_EMAIL_SETTINGS.footer_links,
    },
    sender_name: { type: String, default: DEFAULT_EMAIL_SETTINGS.sender_name },
    disabled_templates: { type: [String], default: [] },
    daily_limit: { type: Number, default: DEFAULT_DAILY_EMAIL_LIMIT, min: 1 },
  },
  { timestamps: true },
);

const EmailSettings = mongoose.model<IEmailSettings>("EmailSettings", EmailSettingsSchema);

export default EmailSettings;
