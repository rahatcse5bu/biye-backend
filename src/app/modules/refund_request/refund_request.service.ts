import { isValidObjectId } from "mongoose";
import Payment from "../payments/payment.model";
import { UserInfoModel } from "../user_info/user_info.model";
import { NotificationService } from "../notifications/notification.service";
import { processRefund, RefundError } from "../bkash/bkash.refund";
import RefundRequest from "./refund_request.model";
import { escapeHtml, formatTaka, mailAdmins, mailUser } from "../../../shared/bibahoMail";

const HOUR = 60 * 60 * 1000;
const FULL_REFUND_WINDOW = 6 * HOUR;
const REQUEST_WINDOW = 3 * 24 * HOUR;
const LATE_POINTS_PER_TAKA = 1.5;

// TODO: refund policy: full amount within 6h, otherwise purchased points at 1.5 points = ৳1.
export const refundAmountFor = (payment: { amount: number; points: number; createdAt: Date }, now = Date.now()) => {
  const age = now - new Date(payment.createdAt).getTime();
  if (age <= FULL_REFUND_WINDOW) return payment.amount;
  return Math.min(payment.amount, Math.floor((payment.points || 0) / LATE_POINTS_PER_TAKA));
};

export const RefundRequestService = {
  create: async (userId: string, paymentId: unknown, reason: unknown) => {
    if (typeof paymentId !== "string" || !isValidObjectId(paymentId)) {
      throw new RefundError(400, "A valid payment is required");
    }
    const user: any = await UserInfoModel.findById(userId).select("email points").lean();
    const payment: any = await Payment.findById(paymentId).lean();
    if (!user || !payment || payment.email !== user.email) {
      throw new RefundError(404, "Payment not found");
    }
    if (payment.status !== "Completed") {
      throw new RefundError(400, "Only completed payments can be refunded");
    }
    if (!payment.transaction_id || !payment.payment_id) {
      throw new RefundError(400, "This payment cannot be refunded online. Please contact support");
    }
    if (Date.now() - new Date(payment.createdAt).getTime() > REQUEST_WINDOW) {
      throw new RefundError(400, "Refunds can only be requested within 3 days of payment");
    }
    if (await RefundRequest.exists({ payment: payment._id })) {
      throw new RefundError(409, "A refund has already been requested for this payment");
    }

    const refundAmount = refundAmountFor(payment);
    if (refundAmount < 1) {
      throw new RefundError(400, "This payment is not eligible for a refund");
    }

    const pointsToHold = payment.points || 0;
    // TODO: hold the points now so they can't be spent while the request waits for review.
    const held = await UserInfoModel.findOneAndUpdate(
      { _id: user._id, points: { $gte: pointsToHold } },
      { $inc: { points: -pointsToHold } },
    );
    if (!held) {
      throw new RefundError(
        400,
        `You need at least ${pointsToHold} points in your account to request this refund`,
      );
    }

    try {
      const request = await RefundRequest.create({
        payment: payment._id,
        user: user._id,
        email: user.email,
        transaction_id: payment.transaction_id,
        paid_amount: payment.amount,
        refund_amount: refundAmount,
        points_held: pointsToHold,
        reason: typeof reason === "string" ? reason.trim().slice(0, 500) : "",
      });

      NotificationService.notify({
        audience: "admin",
        type: "refund",
        title: "নতুন রিফান্ড অনুরোধ",
        message: `${user.email} ৳${refundAmount} রিফান্ড চেয়েছেন (TrxID: ${payment.transaction_id})।`,
        link: "/refunds",
      });
      mailAdmins("নতুন রিফান্ড অনুরোধ", {
        title: "নতুন রিফান্ড অনুরোধ এসেছে",
        tone: "warning",
        paragraphs: ["একজন ব্যবহারকারী রিফান্ড অনুরোধ করেছেন। অ্যাডমিন প্যানেলের Refunds পেজ থেকে অনুমোদন বা বাতিল করুন।"],
        details: [
          { label: "ব্যবহারকারী", value: user.email },
          { label: "ট্রানজেকশন আইডি", value: payment.transaction_id },
          { label: "পেমেন্ট", value: formatTaka(payment.amount) },
          { label: "রিফান্ড", value: formatTaka(refundAmount) },
          { label: "আটকে রাখা পয়েন্ট", value: pointsToHold },
          { label: "কারণ", value: request.reason },
        ],
      });
      mailUser(user.email, "রিফান্ড অনুরোধ পাওয়া গেছে", {
        title: "আপনার রিফান্ড অনুরোধ পাওয়া গেছে",
        paragraphs: [
          "আপনার রিফান্ড অনুরোধটি আমরা পেয়েছি। অ্যাডমিন পর্যালোচনা করে সর্বোচ্চ ৩ কার্যদিবসের মধ্যে সিদ্ধান্ত জানাবেন।",
          `অনুরোধ চলাকালীন এই পেমেন্টের <strong>${pointsToHold} পয়েন্ট</strong> আটকে রাখা হয়েছে। অনুরোধ বাতিল হলে পয়েন্ট ফেরত দেওয়া হবে।`,
        ],
        details: [
          { label: "ট্রানজেকশন আইডি", value: payment.transaction_id },
          { label: "পেমেন্টের পরিমাণ", value: formatTaka(payment.amount) },
          { label: "রিফান্ডের পরিমাণ", value: formatTaka(refundAmount) },
          { label: "কারণ", value: request.reason },
        ],
        action: { label: "পেমেন্ট হিস্টোরি দেখুন", path: "/user/account/payment-and-refund" },
      });
      return request.toObject();
    } catch (error: any) {
      await UserInfoModel.updateOne({ _id: user._id }, { $inc: { points: pointsToHold } });
      if (error?.code === 11000) {
        throw new RefundError(409, "A refund has already been requested for this payment");
      }
      throw error;
    }
  },

  listForUser: async (userId: string) =>
    RefundRequest.find({ user: userId }).sort({ createdAt: -1 }).lean(),

  listAll: async (status?: string) =>
    RefundRequest.find(status && status !== "all" ? { status } : {})
      .sort({ createdAt: -1 })
      .limit(200)
      .lean(),

  approve: async (id: string) => {
    const request: any = isValidObjectId(id) ? await RefundRequest.findById(id).lean() : null;
    if (!request) throw new RefundError(404, "Refund request not found");
    if (request.status !== "requested") {
      throw new RefundError(409, `This request is already ${request.status}`);
    }
    const payment: any = await Payment.findById(request.payment).lean();
    if (!payment) throw new RefundError(404, "Payment not found");

    return processRefund({
      paymentID: payment.payment_id,
      trxID: payment.transaction_id,
      reason: request.reason || "User refund request",
    });
  },

  reject: async (id: string, note: unknown) => {
    const adminNote = typeof note === "string" ? note.trim().slice(0, 500) : "";
    // TODO: atomic so a double click can't return the held points twice.
    const request: any = isValidObjectId(id)
      ? await RefundRequest.findOneAndUpdate(
          { _id: id, status: "requested" },
          { status: "rejected", admin_note: adminNote, processed_at: new Date() },
          { new: true },
        ).lean()
      : null;
    if (!request) {
      const exists: any = isValidObjectId(id) ? await RefundRequest.findById(id).lean() : null;
      throw exists
        ? new RefundError(409, `This request is already ${exists.status}`)
        : new RefundError(404, "Refund request not found");
    }

    await UserInfoModel.updateOne({ _id: request.user }, { $inc: { points: request.points_held } });
    NotificationService.notify({
      recipient: String(request.user),
      audience: "user",
      type: "refund",
      title: "রিফান্ড অনুরোধ বাতিল",
      message: `আপনার ৳${request.refund_amount} রিফান্ড অনুরোধ বাতিল হয়েছে এবং ${request.points_held} পয়েন্ট ফেরত দেওয়া হয়েছে।${adminNote ? ` কারণ: ${adminNote}` : ""}`,
      link: "/user/account/payment-and-refund",
    });
    mailUser(request.email, "রিফান্ড অনুরোধ বাতিল হয়েছে", {
      title: "আপনার রিফান্ড অনুরোধ বাতিল হয়েছে",
      tone: "warning",
      paragraphs: [
        `আপনার রিফান্ড অনুরোধটি অনুমোদিত হয়নি। আটকে রাখা <strong>${escapeHtml(request.points_held)} পয়েন্ট</strong> আপনার অ্যাকাউন্টে ফেরত দেওয়া হয়েছে।`,
      ],
      details: [
        { label: "ট্রানজেকশন আইডি", value: request.transaction_id },
        { label: "অনুরোধকৃত রিফান্ড", value: formatTaka(request.refund_amount) },
        { label: "কারণ", value: adminNote },
      ],
      action: { label: "পেমেন্ট হিস্টোরি দেখুন", path: "/user/account/payment-and-refund" },
    });
    return request;
  },
};
