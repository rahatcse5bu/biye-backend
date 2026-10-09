import mongoose, { Document, Schema } from "mongoose";

export type ReminderSettings = { max_emails: number; cooldown_hours: number };

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = { max_emails: 3, cooldown_hours: 24 };

interface IReminderSettings extends ReminderSettings, Document {
  key: string;
}

// TODO: single document (key "default") with the admin-set limits for proposal reminder emails.
const ReminderSettingsSchema = new Schema<IReminderSettings>(
  {
    key: { type: String, default: "default", unique: true },
    max_emails: { type: Number, default: DEFAULT_REMINDER_SETTINGS.max_emails, min: 0 },
    cooldown_hours: { type: Number, default: DEFAULT_REMINDER_SETTINGS.cooldown_hours, min: 0 },
  },
  { timestamps: true },
);

const ReminderSettingsModel = mongoose.model<IReminderSettings>(
  "ProposalReminderSettings",
  ReminderSettingsSchema,
);

const CACHE_MS = 60 * 1000;
let cache: { value: ReminderSettings; at: number } | null = null;

export const ReminderSettingsService = {
  get: async (): Promise<ReminderSettings> => {
    if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
    const doc: any = await ReminderSettingsModel.findOneAndUpdate(
      { key: "default" },
      { $setOnInsert: { key: "default" } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    const value = {
      max_emails: doc?.max_emails ?? DEFAULT_REMINDER_SETTINGS.max_emails,
      cooldown_hours: doc?.cooldown_hours ?? DEFAULT_REMINDER_SETTINGS.cooldown_hours,
    };
    cache = { value, at: Date.now() };
    return value;
  },

  // TODO: returns cleaned settings, or an error message for the admin.
  parse: (body: any): { data?: ReminderSettings; error?: string } => {
    const maxEmails = Number(body?.max_emails);
    const cooldownHours = Number(body?.cooldown_hours);
    if (!Number.isInteger(maxEmails) || maxEmails < 0 || maxEmails > 20) {
      return { error: "Emails per proposal must be a whole number from 0 to 20" };
    }
    if (!Number.isFinite(cooldownHours) || cooldownHours < 0 || cooldownHours > 720) {
      return { error: "Wait between emails must be from 0 to 720 hours" };
    }
    return { data: { max_emails: maxEmails, cooldown_hours: cooldownHours } };
  },

  update: async (data: ReminderSettings): Promise<ReminderSettings> => {
    await ReminderSettingsModel.findOneAndUpdate({ key: "default" }, data, {
      upsert: true,
      setDefaultsOnInsert: true,
    });
    cache = null;
    return ReminderSettingsService.get();
  },
};

// TODO: what the sender sees: used/allowed counts and when the next email unlocks (null = now or never).
export const reminderStatus = (
  choice: { status?: string; reminder_emails_sent?: number; last_reminder_at?: Date | string | null },
  settings: ReminderSettings,
) => {
  const sent = choice.reminder_emails_sent || 0;
  const remaining = Math.max(0, settings.max_emails - sent);
  const last = choice.last_reminder_at ? new Date(choice.last_reminder_at).getTime() : 0;
  const unlockAt = last + settings.cooldown_hours * 60 * 60 * 1000;
  const waiting = remaining > 0 && last > 0 && unlockAt > Date.now();
  return {
    sent,
    limit: settings.max_emails,
    remaining,
    cooldown_hours: settings.cooldown_hours,
    next_available_at: waiting ? new Date(unlockAt).toISOString() : null,
    can_send: choice.status === "pending" && remaining > 0 && !waiting,
  };
};
