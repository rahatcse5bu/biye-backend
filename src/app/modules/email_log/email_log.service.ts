import EmailLog from "./email_log.model";
import EmailSettings, { DEFAULT_DAILY_EMAIL_LIMIT } from "../email_settings/email_settings.model";

const DAY_MS = 24 * 60 * 60 * 1000;
const WARNING_RATIO = 0.8;

export const EmailUsageService = {
  getDailyLimit: async (): Promise<number> => {
    const doc: any = await EmailSettings.findOne({ key: "default" }).select("daily_limit").lean();
    return doc?.daily_limit || DEFAULT_DAILY_EMAIL_LIMIT;
  },

  setDailyLimit: async (limit: number): Promise<number> => {
    await EmailSettings.findOneAndUpdate(
      { key: "default" },
      { daily_limit: limit },
      { upsert: true, setDefaultsOnInsert: true },
    );
    return limit;
  },

  // TODO: Gmail gives no quota API over SMTP, so usage is counted from our own send log.
  getUsage: async () => {
    const now = Date.now();
    const since = new Date(now - DAY_MS);
    const weekStart = new Date(now - 7 * DAY_MS);

    const [limit, totals, sentLast24h, oldestInWindow, lastLimitHit, recentFailures, daily, firstLog] =
      await Promise.all([
        EmailUsageService.getDailyLimit(),
        EmailLog.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        EmailLog.countDocuments({ status: "sent", createdAt: { $gte: since } }),
        EmailLog.findOne({ status: "sent", createdAt: { $gte: since } }).sort({ createdAt: 1 }).select("createdAt").lean(),
        EmailLog.findOne({ limit_hit: true, createdAt: { $gte: since } }).sort({ createdAt: -1 }).select("createdAt").lean(),
        EmailLog.find({ status: "failed" }).sort({ createdAt: -1 }).limit(5).select("to subject error limit_hit createdAt").lean(),
        EmailLog.aggregate([
          { $match: { createdAt: { $gte: weekStart } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Dhaka" } },
              sent: { $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] } },
              failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        EmailLog.findOne().sort({ createdAt: 1 }).select("createdAt").lean(),
      ]);

    const count = (status: string) => totals.find((row: any) => row._id === status)?.count || 0;
    // TODO: after a Gmail lockout, sending resumes up to 24h after the rejection.
    const blockedUntil = lastLimitHit ? new Date(lastLimitHit.createdAt.getTime() + DAY_MS) : null;
    // TODO: a lockout means Gmail's own count (which includes manual sends) is full, whatever ours says.
    const remaining = blockedUntil ? 0 : Math.max(0, limit - sentLast24h);
    const status = blockedUntil || remaining === 0
      ? "exhausted"
      : sentLast24h >= limit * WARNING_RATIO
        ? "warning"
        : "ok";

    return {
      status,
      daily_limit: limit,
      sent_last_24h: sentLast24h,
      remaining,
      next_slot_at: oldestInWindow ? new Date(oldestInWindow.createdAt.getTime() + DAY_MS) : null,
      blocked_until: blockedUntil,
      total_sent: count("sent"),
      total_failed: count("failed"),
      counting_since: firstLog?.createdAt || null,
      daily: daily.map((row: any) => ({ date: row._id, sent: row.sent, failed: row.failed })),
      recent_failures: recentFailures,
    };
  },
};
