import EmailSettings, { DEFAULT_EMAIL_SETTINGS, LEGACY_LOGO_URL, LOCKED_TEMPLATES, SocialLink } from "./email_settings.model";

export type EmailBranding = {
  logo_url: string;
  support_email: string;
  support_phone: string;
  social_links: SocialLink[];
  footer_links: SocialLink[];
  sender_name: string;
  disabled_templates: string[];
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
    logo_url: !doc?.logo_url || doc.logo_url === LEGACY_LOGO_URL ? DEFAULT_EMAIL_SETTINGS.logo_url : doc.logo_url,
    support_email: doc?.support_email || DEFAULT_EMAIL_SETTINGS.support_email,
    support_phone: doc?.support_phone ?? DEFAULT_EMAIL_SETTINGS.support_phone,
    social_links: doc?.social_links || [],
    // TODO: docs saved before footer_links existed have no field; an emptied list stays empty.
    footer_links: doc?.footer_links ?? DEFAULT_EMAIL_SETTINGS.footer_links,
    sender_name: doc?.sender_name || DEFAULT_EMAIL_SETTINGS.sender_name,
    disabled_templates: (doc?.disabled_templates || []).filter((id: string) => !LOCKED_TEMPLATES.includes(id)),
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
    const logoUrl = typeof body?.logo_url === "string" ? body.logo_url.trim() : "";
    if (logoUrl && !isHttpUrl(logoUrl)) return { error: "Logo URL must be a valid http(s) link, or empty for the default logo" };
    const supportEmail = typeof body?.support_email === "string" ? body.support_email.trim() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) {
      return { error: "Support email is not valid" };
    }
    const supportPhone = typeof body?.support_phone === "string" ? body.support_phone.trim() : "";
    if (supportPhone.length > 30 || /[^\d+\-\s()]/.test(supportPhone)) {
      return { error: "Support phone may contain only digits, spaces, +, - and brackets (up to 30)" };
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
    const footer = Array.isArray(body?.footer_links) ? body.footer_links : [];
    if (footer.length > 8) return { error: "At most 8 footer links are allowed" };
    const footerLinks: SocialLink[] = [];
    for (const link of footer) {
      const label = typeof link?.label === "string" ? link.label.trim() : "";
      if (!label || label.length > 40) return { error: "Each footer link needs a name (up to 40 characters)" };
      const url = typeof link?.url === "string" ? link.url.trim() : "";
      if (!/^\/[^\s/]/.test(url) && !isHttpUrl(url)) {
        return { error: `"${label}" needs a site path like /privacy-policy or a valid http(s) link` };
      }
      footerLinks.push({ label, url });
    }
    const senderName = typeof body?.sender_name === "string" ? body.sender_name.trim() : "";
    if (!senderName || senderName.length > 60 || /["<>\\\r\n]/.test(senderName)) {
      return { error: "Sender name is required (up to 60 characters, no quotes or < >)" };
    }
    const disabled = Array.isArray(body?.disabled_templates) ? body.disabled_templates : [];
    const disabledTemplates = [
      ...new Set<string>(disabled.filter((id: unknown) => typeof id === "string" && /^[A-Za-z]{1,40}$/.test(id))),
    ].filter((id) => !LOCKED_TEMPLATES.includes(id));
    return {
      data: {
        logo_url: logoUrl,
        support_email: supportEmail,
        support_phone: supportPhone,
        social_links: socialLinks,
        footer_links: footerLinks,
        sender_name: senderName,
        disabled_templates: disabledTemplates,
      },
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
