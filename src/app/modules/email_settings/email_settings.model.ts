import mongoose, { Document, Schema } from "mongoose";

export type SocialLink = { label: string; url: string };

export interface IEmailSettings extends Document {
  key: string;
  logo_url: string;
  support_email: string;
  social_links: SocialLink[];
  daily_limit: number;
}

// TODO: Gmail allows ~500 recipients per rolling 24h; Google Workspace allows 2000.
export const DEFAULT_DAILY_EMAIL_LIMIT = 500;

export const DEFAULT_EMAIL_SETTINGS = {
  logo_url: "https://res.cloudinary.com/dfcyydhfn/image/upload/v1791121207/logo_vmmj9g.png",
  support_email: "bibahosupport@gmail.com",
  social_links: [] as SocialLink[],
};

// TODO: single document (key "default") with the branding every email uses.
const EmailSettingsSchema = new Schema<IEmailSettings>(
  {
    key: { type: String, default: "default", unique: true },
    logo_url: { type: String, default: DEFAULT_EMAIL_SETTINGS.logo_url },
    support_email: { type: String, default: DEFAULT_EMAIL_SETTINGS.support_email },
    social_links: {
      type: [{ _id: false, label: { type: String, required: true }, url: { type: String, required: true } }],
      default: [],
    },
    daily_limit: { type: Number, default: DEFAULT_DAILY_EMAIL_LIMIT, min: 1 },
  },
  { timestamps: true },
);

const EmailSettings = mongoose.model<IEmailSettings>("EmailSettings", EmailSettingsSchema);

export default EmailSettings;
