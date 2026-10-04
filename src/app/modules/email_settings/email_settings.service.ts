import EmailSettings, { DEFAULT_EMAIL_SETTINGS, SocialLink } from "./email_settings.model";

export type EmailBranding = {
  logo_url: string;
  support_email: string;
  social_links: SocialLink[];
};

const CACHE_MS = 60 * 1000;
let cache: { value: EmailBranding; at: number } | null = null;

const isHttpUrl = (value: unknown) => {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

const fetchSettings = async (): Promise<EmailBranding> => {
  const doc: any = await EmailSettings.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default" } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  return {
    logo_url: doc?.logo_url || DEFAULT_EMAIL_SETTINGS.logo_url,
    support_email: doc?.support_email || DEFAULT_EMAIL_SETTINGS.support_email,
    social_links: doc?.social_links || [],
  };
};

export const EmailSettingsService = {
  // TODO: cached so every email doesn't hit the database; falls back to defaults if the DB fails.
  get: async (): Promise<EmailBranding> => {
    if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
    try {
      const value = await fetchSettings();
      cache = { value, at: Date.now() };
      return value;
    } catch (error) {
      console.error("Email settings load failed, using defaults:", error);
      return cache?.value || { ...DEFAULT_EMAIL_SETTINGS };
    }
  },

  // TODO: returns cleaned settings, or an error message for the admin.
  parse: (body: any): { data?: EmailBranding; error?: string } => {
    if (!isHttpUrl(body?.logo_url)) return { error: "Logo URL must be a valid http(s) link" };
    const supportEmail = typeof body?.support_email === "string" ? body.support_email.trim() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) {
      return { error: "Support email is not valid" };
    }
    const links = Array.isArray(body?.social_links) ? body.social_links : [];
    if (links.length > 8) return { error: "At most 8 social links are allowed" };
    const socialLinks: SocialLink[] = [];
    for (const link of links) {
      const label = typeof link?.label === "string" ? link.label.trim() : "";
      if (!label || label.length > 40) return { error: "Each social link needs a name (up to 40 characters)" };
      if (!isHttpUrl(link?.url)) return { error: `"${label}" needs a valid http(s) link` };
      socialLinks.push({ label, url: link.url.trim() });
    }
    return {
      data: { logo_url: body.logo_url.trim(), support_email: supportEmail, social_links: socialLinks },
    };
  },

  update: async (data: EmailBranding): Promise<EmailBranding> => {
    await EmailSettings.findOneAndUpdate({ key: "default" }, data, {
      upsert: true,
      setDefaultsOnInsert: true,
    });
    cache = null;
    return EmailSettingsService.get();
  },
};
