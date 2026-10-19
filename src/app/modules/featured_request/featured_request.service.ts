import { isValidObjectId } from "mongoose";
import createPayment from "../../../helpers/createPayment";
import ApiError from "../../middlewares/ApiError";
import GeneralInfo from "../general_info/general_info.model";
import { UserInfoModel } from "../user_info/user_info.model";
import Payment from "../payments/payment.model";
import BkashIntent from "../bkash/bkash_intent.model";
import { processRefund, RefundError } from "../bkash/bkash.refund";
import { NotificationService } from "../notifications/notification.service";
import { mailAdmins, mailUser } from "../../../shared/bibahoMail";
import { emailTemplates } from "../../../shared/emailTemplates";
import { FeaturedRequest, FeaturedSettings, FeaturedStatus } from "./featured_request.model";

export const FEATURED_PURPOSE = "featured";
const DAY = 24 * 60 * 60 * 1000;

export type FeaturedSettingsData = { enabled: boolean; price: number; duration_days: number };

const getSettings = async (): Promise<FeaturedSettingsData> => {
  const doc: any = await FeaturedSettings.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default" } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  return { enabled: !!doc.enabled, price: doc.price, duration_days: doc.duration_days };
};

// TODO: returns cleaned settings, or an error message for the admin.
const parseSettings = (body: any): { data?: FeaturedSettingsData; error?: string } => {
  const price = Number(body?.price);
  const days = Number(body?.duration_days);
  if (!Number.isInteger(price) || price < 1 || price > 100000) return { error: "Price must be a whole number of taka between 1 and 100000" };
  if (!Number.isInteger(days) || days < 1 || days > 365) return { error: "Duration must be between 1 and 365 days" };
  return { data: { enabled: body?.enabled !== false, price, duration_days: days } };
};

let lastSweep = 0;
// TODO: un-features paid biodatas whose time ran out; throttled so listing pages don't write on every request.
export const expireFeaturedBiodatas = async () => {
  if (Date.now() - lastSweep < 60 * 1000) return;
  lastSweep = Date.now();
  try {
    await GeneralInfo.updateMany(
      { isFeatured: true, featured_until: { $ne: null, $lte: new Date() } },
      { $set: { isFeatured: false, featured_until: null } },
    );
  } catch (error) {
    console.error("Featured expiry sweep failed:", error);
  }
};

// TODO: why a member can't buy featuring right now; null means they can.
const blockReason = (settings: FeaturedSettingsData, user: any, biodata: any, pending: boolean) => {
  if (!settings.enabled) return "ফিচার্ড বায়োডাটা অনুরোধ এই মুহূর্তে বন্ধ আছে।";
  if (!biodata) return "ফিচার্ড করার আগে আপনার বায়োডাটা তৈরি করুন।";
  if (user?.user_status !== "active" || biodata.biodata_status !== "approved") {
    return "আপনার বায়োডাটা প্রকাশিত (সক্রিয়) হলে ফিচার্ড করার অনুরোধ করতে পারবেন।";
  }
  if (pending) return "আপনার একটি অনুরোধ অ্যাডমিনের পর্যালোচনার অপেক্ষায় আছে।";
  if (biodata.isFeatured && !biodata.featured_until) return "আপনার বায়োডাটা ইতিমধ্যে ফিচার্ড করা আছে।";
  return null;
};

const loadMember = async (userId: string) => {
  const [settings, user, biodata, pending] = await Promise.all([
    getSettings(),
    UserInfoModel.findById(userId).select("email username user_id user_status").lean(),
    GeneralInfo.findOne({ user: userId }).select("biodata_status isFeatured featured_until").lean(),
    FeaturedRequest.exists({ user: userId, status: "pending" }),
  ]);
  return { settings, user: user as any, biodata: biodata as any, pending: !!pending };
};

const getMine = async (userId: string) => {
  await expireFeaturedBiodatas();
  const { settings, user, biodata, pending } = await loadMember(userId);
  const requests = await FeaturedRequest.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .select("status amount duration_days transaction_id admin_note refunded reviewed_at featured_until impressions clicks createdAt")
    .lean();
  const reason = blockReason(settings, user, biodata, pending);
  return {
    settings,
    can_request: !reason,
    reason,
    is_featured: !!biodata?.isFeatured,
    featured_until: biodata?.featured_until || null,
    requests,
  };
};

// TODO: starts a bKash payment for the admin-set price; the amount never comes from the browser.
const startCheckout = async (userId: string, callbackURL: unknown) => {
  if (typeof callbackURL !== "string" || !/^https?:\/\//.test(callbackURL)) {
    throw new ApiError(400, "callbackURL is required");
  }
  const { settings, user, biodata, pending } = await loadMember(userId);
  const reason = blockReason(settings, user, biodata, pending);
  if (reason) throw new ApiError(400, reason);

  const created: any = await createPayment({ amount: settings.price, callbackURL } as any);
  if (!created?.paymentID || !created?.bkashURL) {
    throw new ApiError(502, "বিকাশ পেমেন্ট শুরু করা যায়নি। আবার চেষ্টা করুন।");
  }
  await BkashIntent.create({ payment_id: created.paymentID, user: userId, amount: settings.price, purpose: FEATURED_PURPOSE });
  return { bkashURL: created.bkashURL, amount: settings.price, duration_days: settings.duration_days };
};

// TODO: called by bKash after-pay once a featured payment is Completed; insert-once by paymentID.
const recordPayment = async (userId: string, email: string, paymentID: string, response: any) => {
  const settings = await getSettings();
  const existing: any = await Payment.findOneAndUpdate(
    { payment_id: paymentID },
    {
      $setOnInsert: {
        email,
        points: 0,
        amount: response?.amount,
        transaction_id: response?.trxID,
        payment_id: paymentID,
        status: response?.transactionStatus,
        trnx_time: response?.paymentCreateTime || response?.paymentExecuteTime,
        purpose: FEATURED_PURPOSE,
      },
    },
    { upsert: true, new: false },
  ).lean();
  if (existing) return { alreadyRecorded: true, payment: existing };

  const [user, biodata]: any[] = await Promise.all([
    UserInfoModel.findById(userId).select("username user_id").lean(),
    GeneralInfo.findOne({ user: userId }).select("_id").lean(),
  ]);
  const request = await FeaturedRequest.create({
    user: userId,
    biodata: biodata?._id,
    bio_user_id: user?.user_id,
    email,
    payment_id: paymentID,
    transaction_id: response?.trxID,
    amount: Number(response?.amount) || settings.price,
    duration_days: settings.duration_days,
  });

  NotificationService.notify({
    recipient: userId,
    audience: "user",
    type: "payment",
    title: "ফিচার্ড অনুরোধ জমা হয়েছে",
    message: `৳${request.amount} পেমেন্ট সম্পন্ন হয়েছে। অ্যাডমিন অনুমোদন দিলে আপনার বায়োডাটা ${request.duration_days} দিনের জন্য ফিচার্ড হবে।`,
    link: "/user/account/featured",
  });
  NotificationService.notify({
    audience: "admin",
    type: "payment",
    priority: "important",
    title: "নতুন ফিচার্ড অনুরোধ",
    message: `বায়োডাটা নং ${user?.user_id ?? ""} ৳${request.amount} দিয়ে ফিচার্ড করার অনুরোধ করেছেন।`,
    link: "/featured-requests",
  });
  const mail = emailTemplates.featuredRequested({
    name: user?.username,
    biodataNo: user?.user_id,
    amount: request.amount,
    days: request.duration_days,
    trxId: request.transaction_id,
  });
  mailUser(email, mail.subject, mail.content);
  mailAdmins("নতুন ফিচার্ড বায়োডাটা অনুরোধ", {
    icon: "bell",
    eyebrow: "অ্যাডমিন · ফিচার্ড",
    title: "নতুন ফিচার্ড বায়োডাটা অনুরোধ",
    paragraphs: ["একজন সদস্য পেমেন্ট করে তার বায়োডাটা ফিচার্ড করার অনুরোধ করেছেন। অ্যাডমিন প্যানেলের Featured Requests পেজ থেকে অনুমোদন বা বাতিল করুন।"],
    details: [
      { label: "বায়োডাটা নং", value: user?.user_id },
      { label: "ইমেইল", value: email },
      { label: "পরিমাণ", value: `৳${request.amount}` },
      { label: "মেয়াদ", value: `${request.duration_days} দিন` },
      { label: "ট্রানজেকশন আইডি", value: request.transaction_id },
    ],
  });
  return { alreadyRecorded: false, request };
};

// TODO: credits impressions/clicks to the running paid period of each biodata; admin-featured biodatas have none and are skipped.
const track = async (biodataIds: unknown, event: unknown) => {
  if (event !== "impression" && event !== "click") throw new ApiError(400, "Invalid event");
  const ids = [...new Set(Array.isArray(biodataIds) ? biodataIds : [])]
    .filter((id): id is string => typeof id === "string" && isValidObjectId(id))
    .slice(0, 24);
  const field = event === "click" ? "clicks" : "impressions";
  const now = new Date();
  await Promise.all(
    ids.map((id) =>
      FeaturedRequest.findOneAndUpdate(
        { biodata: id, status: "approved", featured_until: { $gt: now } },
        { $inc: { [field]: 1 } },
        { sort: { featured_until: 1 } },
      ),
    ),
  );
};

const listAll = async (status: unknown, page: unknown, limit: unknown) => {
  await expireFeaturedBiodatas();
  const filter: Record<string, unknown> = {};
  if (typeof status === "string" && ["pending", "approved", "rejected"].includes(status)) filter.status = status;
  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.min(100, Math.max(1, Number(limit) || 20));
  const [data, total, pendingCount] = await Promise.all([
    FeaturedRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .populate("biodata", "isFeatured featured_until biodata_status")
      .lean(),
    FeaturedRequest.countDocuments(filter),
    FeaturedRequest.countDocuments({ status: "pending" }),
  ]);
  return { data, total, page: pageNumber, limit: limitNumber, pending: pendingCount };
};

// TODO: atomically moves a pending request to its final status so two admins can't both act on it.
const claimPending = async (id: string, status: FeaturedStatus, note: string) => {
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid request id");
  const request: any = await FeaturedRequest.findOneAndUpdate(
    { _id: id, status: "pending" },
    { status, admin_note: note, reviewed_at: new Date() },
    { new: true },
  );
  if (!request) {
    const exists = await FeaturedRequest.exists({ _id: id });
    throw new ApiError(exists ? 409 : 404, exists ? "This request was already reviewed" : "Request not found");
  }
  return request;
};

const cleanNote = (note: unknown) => (typeof note === "string" ? note.trim().slice(0, 500) : "");

const approve = async (id: string, note: unknown) => {
  const request = await claimPending(id, "approved", cleanNote(note));
  const biodata: any = await GeneralInfo.findById(request.biodata).select("isFeatured featured_until").lean();
  // TODO: renewals extend from the current end date instead of cutting it short.
  const currentEnd = biodata?.isFeatured && biodata?.featured_until ? new Date(biodata.featured_until).getTime() : 0;
  const until = new Date(Math.max(Date.now(), currentEnd) + request.duration_days * DAY);
  await GeneralInfo.updateOne({ _id: request.biodata }, { $set: { isFeatured: true, featured_until: until } });
  request.featured_until = until;
  await request.save();

  NotificationService.notify({
    recipient: String(request.user),
    audience: "user",
    type: "biodata",
    title: "আপনার বায়োডাটা ফিচার্ড হয়েছে",
    message: `অভিনন্দন! আপনার বায়োডাটা হোমপেজে ফিচার্ড করা হয়েছে।`,
    link: "/user/account/featured",
  });
  const user: any = await UserInfoModel.findById(request.user).select("username").lean();
  const mail = emailTemplates.featuredApproved({ name: user?.username, biodataNo: request.bio_user_id, until });
  mailUser(request.email, mail.subject, mail.content);
  return request;
};

const reject = async (id: string, note: unknown, refund: unknown) => {
  const request = await claimPending(id, "rejected", cleanNote(note));
  if (refund === true || refund === "true") {
    try {
      await processRefund({ paymentID: request.payment_id, trxID: request.transaction_id, reason: "Featured request rejected" });
      request.refunded = true;
      await request.save();
    } catch (error: any) {
      // TODO: keep the rejection but tell the admin the refund failed so they can retry from Payments.
      const message = error instanceof RefundError ? error.message : "bKash refund failed";
      console.error("Featured refund failed:", error);
      throw new ApiError(502, `Request rejected, but the refund failed: ${message}. Refund it from the Payments page.`);
    }
  }

  NotificationService.notify({
    recipient: String(request.user),
    audience: "user",
    type: "biodata",
    title: "ফিচার্ড অনুরোধ বাতিল হয়েছে",
    message: `${request.admin_note ? `কারণ: ${request.admin_note}। ` : ""}${request.refunded ? "আপনার টাকা বিকাশে ফেরত পাঠানো হয়েছে।" : ""}`,
    link: "/user/account/featured",
  });
  const user: any = await UserInfoModel.findById(request.user).select("username").lean();
  const mail = emailTemplates.featuredRejected({
    name: user?.username,
    reason: request.admin_note,
    refunded: request.refunded,
    amount: request.amount,
  });
  mailUser(request.email, mail.subject, mail.content);
  return request;
};

export const FeaturedRequestService = {
  getSettings,
  parseSettings,
  updateSettings: async (data: FeaturedSettingsData) => {
    await FeaturedSettings.findOneAndUpdate({ key: "default" }, data, { upsert: true, setDefaultsOnInsert: true });
    return getSettings();
  },
  getMine,
  startCheckout,
  recordPayment,
  track,
  listAll,
  approve,
  reject,
};
