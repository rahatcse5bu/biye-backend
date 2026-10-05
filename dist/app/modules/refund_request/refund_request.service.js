"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundRequestService = exports.refundAmountFor = void 0;
const mongoose_1 = require("mongoose");
const payment_model_1 = __importDefault(require("../payments/payment.model"));
const user_info_model_1 = require("../user_info/user_info.model");
const notification_service_1 = require("../notifications/notification.service");
const bkash_refund_1 = require("../bkash/bkash.refund");
const refund_request_model_1 = __importDefault(require("./refund_request.model"));
const bibahoMail_1 = require("../../../shared/bibahoMail");
const HOUR = 60 * 60 * 1000;
const FULL_REFUND_WINDOW = 6 * HOUR;
const REQUEST_WINDOW = 3 * 24 * HOUR;
const LATE_POINTS_PER_TAKA = 1.5;
// TODO: refund policy: full amount within 6h, otherwise purchased points at 1.5 points = ৳1.
const refundAmountFor = (payment, now = Date.now()) => {
    const age = now - new Date(payment.createdAt).getTime();
    if (age <= FULL_REFUND_WINDOW)
        return payment.amount;
    return Math.min(payment.amount, Math.floor((payment.points || 0) / LATE_POINTS_PER_TAKA));
};
exports.refundAmountFor = refundAmountFor;
exports.RefundRequestService = {
    create: (userId, paymentId, reason) => __awaiter(void 0, void 0, void 0, function* () {
        if (typeof paymentId !== "string" || !(0, mongoose_1.isValidObjectId)(paymentId)) {
            throw new bkash_refund_1.RefundError(400, "A valid payment is required");
        }
        const user = yield user_info_model_1.UserInfoModel.findById(userId).select("email points").lean();
        const payment = yield payment_model_1.default.findById(paymentId).lean();
        if (!user || !payment || payment.email !== user.email) {
            throw new bkash_refund_1.RefundError(404, "Payment not found");
        }
        if (payment.status !== "Completed") {
            throw new bkash_refund_1.RefundError(400, "Only completed payments can be refunded");
        }
        if (!payment.transaction_id || !payment.payment_id) {
            throw new bkash_refund_1.RefundError(400, "This payment cannot be refunded online. Please contact support");
        }
        if (Date.now() - new Date(payment.createdAt).getTime() > REQUEST_WINDOW) {
            throw new bkash_refund_1.RefundError(400, "Refunds can only be requested within 3 days of payment");
        }
        if (yield refund_request_model_1.default.exists({ payment: payment._id })) {
            throw new bkash_refund_1.RefundError(409, "A refund has already been requested for this payment");
        }
        const refundAmount = (0, exports.refundAmountFor)(payment);
        if (refundAmount < 1) {
            throw new bkash_refund_1.RefundError(400, "This payment is not eligible for a refund");
        }
        const pointsToHold = payment.points || 0;
        // TODO: hold the points now so they can't be spent while the request waits for review.
        const held = yield user_info_model_1.UserInfoModel.findOneAndUpdate({ _id: user._id, points: { $gte: pointsToHold } }, { $inc: { points: -pointsToHold } });
        if (!held) {
            throw new bkash_refund_1.RefundError(400, `You need at least ${pointsToHold} points in your account to request this refund`);
        }
        try {
            const request = yield refund_request_model_1.default.create({
                payment: payment._id,
                user: user._id,
                email: user.email,
                transaction_id: payment.transaction_id,
                paid_amount: payment.amount,
                refund_amount: refundAmount,
                points_held: pointsToHold,
                reason: typeof reason === "string" ? reason.trim().slice(0, 500) : "",
            });
            notification_service_1.NotificationService.notify({
                audience: "admin",
                type: "refund",
                title: "নতুন রিফান্ড অনুরোধ",
                message: `${user.email} ৳${refundAmount} রিফান্ড চেয়েছেন (TrxID: ${payment.transaction_id})।`,
                link: "/refunds",
            });
            (0, bibahoMail_1.mailAdmins)("নতুন রিফান্ড অনুরোধ", {
                title: "নতুন রিফান্ড অনুরোধ এসেছে",
                tone: "warning",
                paragraphs: ["একজন ব্যবহারকারী রিফান্ড অনুরোধ করেছেন। অ্যাডমিন প্যানেলের Refunds পেজ থেকে অনুমোদন বা বাতিল করুন।"],
                details: [
                    { label: "ব্যবহারকারী", value: user.email },
                    { label: "ট্রানজেকশন আইডি", value: payment.transaction_id },
                    { label: "পেমেন্ট", value: (0, bibahoMail_1.formatTaka)(payment.amount) },
                    { label: "রিফান্ড", value: (0, bibahoMail_1.formatTaka)(refundAmount) },
                    { label: "আটকে রাখা পয়েন্ট", value: pointsToHold },
                    { label: "কারণ", value: request.reason },
                ],
            });
            (0, bibahoMail_1.mailUser)(user.email, "রিফান্ড অনুরোধ পাওয়া গেছে", {
                title: "আপনার রিফান্ড অনুরোধ পাওয়া গেছে",
                paragraphs: [
                    "আপনার রিফান্ড অনুরোধটি আমরা পেয়েছি। অ্যাডমিন পর্যালোচনা করে সর্বোচ্চ ৩ কার্যদিবসের মধ্যে সিদ্ধান্ত জানাবেন।",
                    `অনুরোধ চলাকালীন এই পেমেন্টের <strong>${pointsToHold} পয়েন্ট</strong> আটকে রাখা হয়েছে। অনুরোধ বাতিল হলে পয়েন্ট ফেরত দেওয়া হবে।`,
                ],
                details: [
                    { label: "ট্রানজেকশন আইডি", value: payment.transaction_id },
                    { label: "পেমেন্টের পরিমাণ", value: (0, bibahoMail_1.formatTaka)(payment.amount) },
                    { label: "রিফান্ডের পরিমাণ", value: (0, bibahoMail_1.formatTaka)(refundAmount) },
                    { label: "কারণ", value: request.reason },
                ],
                action: { label: "পেমেন্ট হিস্টোরি দেখুন", path: "/user/account/payment-and-refund" },
            });
            return request.toObject();
        }
        catch (error) {
            yield user_info_model_1.UserInfoModel.updateOne({ _id: user._id }, { $inc: { points: pointsToHold } });
            if ((error === null || error === void 0 ? void 0 : error.code) === 11000) {
                throw new bkash_refund_1.RefundError(409, "A refund has already been requested for this payment");
            }
            throw error;
        }
    }),
    listForUser: (userId) => __awaiter(void 0, void 0, void 0, function* () { return refund_request_model_1.default.find({ user: userId }).sort({ createdAt: -1 }).lean(); }),
    listAll: (status) => __awaiter(void 0, void 0, void 0, function* () {
        return refund_request_model_1.default.find(status && status !== "all" ? { status } : {})
            .sort({ createdAt: -1 })
            .limit(200)
            .lean();
    }),
    approve: (id) => __awaiter(void 0, void 0, void 0, function* () {
        const request = (0, mongoose_1.isValidObjectId)(id) ? yield refund_request_model_1.default.findById(id).lean() : null;
        if (!request)
            throw new bkash_refund_1.RefundError(404, "Refund request not found");
        if (request.status !== "requested") {
            throw new bkash_refund_1.RefundError(409, `This request is already ${request.status}`);
        }
        const payment = yield payment_model_1.default.findById(request.payment).lean();
        if (!payment)
            throw new bkash_refund_1.RefundError(404, "Payment not found");
        return (0, bkash_refund_1.processRefund)({
            paymentID: payment.payment_id,
            trxID: payment.transaction_id,
            reason: request.reason || "User refund request",
        });
    }),
    reject: (id, note) => __awaiter(void 0, void 0, void 0, function* () {
        const adminNote = typeof note === "string" ? note.trim().slice(0, 500) : "";
        // TODO: atomic so a double click can't return the held points twice.
        const request = (0, mongoose_1.isValidObjectId)(id)
            ? yield refund_request_model_1.default.findOneAndUpdate({ _id: id, status: "requested" }, { status: "rejected", admin_note: adminNote, processed_at: new Date() }, { new: true }).lean()
            : null;
        if (!request) {
            const exists = (0, mongoose_1.isValidObjectId)(id) ? yield refund_request_model_1.default.findById(id).lean() : null;
            throw exists
                ? new bkash_refund_1.RefundError(409, `This request is already ${exists.status}`)
                : new bkash_refund_1.RefundError(404, "Refund request not found");
        }
        yield user_info_model_1.UserInfoModel.updateOne({ _id: request.user }, { $inc: { points: request.points_held } });
        notification_service_1.NotificationService.notify({
            recipient: String(request.user),
            audience: "user",
            type: "refund",
            title: "রিফান্ড অনুরোধ বাতিল",
            message: `আপনার ৳${request.refund_amount} রিফান্ড অনুরোধ বাতিল হয়েছে এবং ${request.points_held} পয়েন্ট ফেরত দেওয়া হয়েছে।${adminNote ? ` কারণ: ${adminNote}` : ""}`,
            link: "/user/account/payment-and-refund",
        });
        (0, bibahoMail_1.mailUser)(request.email, "রিফান্ড অনুরোধ বাতিল হয়েছে", {
            title: "আপনার রিফান্ড অনুরোধ বাতিল হয়েছে",
            tone: "warning",
            paragraphs: [
                `আপনার রিফান্ড অনুরোধটি অনুমোদিত হয়নি। আটকে রাখা <strong>${(0, bibahoMail_1.escapeHtml)(request.points_held)} পয়েন্ট</strong> আপনার অ্যাকাউন্টে ফেরত দেওয়া হয়েছে।`,
            ],
            details: [
                { label: "ট্রানজেকশন আইডি", value: request.transaction_id },
                { label: "অনুরোধকৃত রিফান্ড", value: (0, bibahoMail_1.formatTaka)(request.refund_amount) },
                { label: "কারণ", value: adminNote },
            ],
            action: { label: "পেমেন্ট হিস্টোরি দেখুন", path: "/user/account/payment-and-refund" },
        });
        return request;
    }),
};
