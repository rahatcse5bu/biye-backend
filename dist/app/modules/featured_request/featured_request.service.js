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
exports.FeaturedRequestService = exports.expireFeaturedBiodatas = exports.FEATURED_PURPOSE = void 0;
const mongoose_1 = require("mongoose");
const createPayment_1 = __importDefault(require("../../../helpers/createPayment"));
const ApiError_1 = __importDefault(require("../../middlewares/ApiError"));
const general_info_model_1 = __importDefault(require("../general_info/general_info.model"));
const user_info_model_1 = require("../user_info/user_info.model");
const payment_model_1 = __importDefault(require("../payments/payment.model"));
const bkash_intent_model_1 = __importDefault(require("../bkash/bkash_intent.model"));
const bkash_refund_1 = require("../bkash/bkash.refund");
const notification_service_1 = require("../notifications/notification.service");
const bibahoMail_1 = require("../../../shared/bibahoMail");
const emailTemplates_1 = require("../../../shared/emailTemplates");
const featured_request_model_1 = require("./featured_request.model");
exports.FEATURED_PURPOSE = "featured";
const DAY = 24 * 60 * 60 * 1000;
const getSettings = () => __awaiter(void 0, void 0, void 0, function* () {
    const doc = yield featured_request_model_1.FeaturedSettings.findOneAndUpdate({ key: "default" }, { $setOnInsert: { key: "default" } }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
    return { enabled: !!doc.enabled, price: doc.price, duration_days: doc.duration_days };
});
// TODO: returns cleaned settings, or an error message for the admin.
const parseSettings = (body) => {
    const price = Number(body === null || body === void 0 ? void 0 : body.price);
    const days = Number(body === null || body === void 0 ? void 0 : body.duration_days);
    if (!Number.isInteger(price) || price < 1 || price > 100000)
        return { error: "Price must be a whole number of taka between 1 and 100000" };
    if (!Number.isInteger(days) || days < 1 || days > 365)
        return { error: "Duration must be between 1 and 365 days" };
    return { data: { enabled: (body === null || body === void 0 ? void 0 : body.enabled) !== false, price, duration_days: days } };
};
let lastSweep = 0;
// TODO: un-features paid biodatas whose time ran out; throttled so listing pages don't write on every request.
const expireFeaturedBiodatas = () => __awaiter(void 0, void 0, void 0, function* () {
    if (Date.now() - lastSweep < 60 * 1000)
        return;
    lastSweep = Date.now();
    try {
        yield general_info_model_1.default.updateMany({ isFeatured: true, featured_until: { $ne: null, $lte: new Date() } }, { $set: { isFeatured: false, featured_until: null } });
    }
    catch (error) {
        console.error("Featured expiry sweep failed:", error);
    }
});
exports.expireFeaturedBiodatas = expireFeaturedBiodatas;
// TODO: why a member can't buy featuring right now; null means they can.
const blockReason = (settings, user, biodata, pending) => {
    if (!settings.enabled)
        return "ফিচার্ড বায়োডাটা অনুরোধ এই মুহূর্তে বন্ধ আছে।";
    if (!biodata)
        return "ফিচার্ড করার আগে আপনার বায়োডাটা তৈরি করুন।";
    if ((user === null || user === void 0 ? void 0 : user.user_status) !== "active" || biodata.biodata_status !== "approved") {
        return "আপনার বায়োডাটা প্রকাশিত (সক্রিয়) হলে ফিচার্ড করার অনুরোধ করতে পারবেন।";
    }
    if (pending)
        return "আপনার একটি অনুরোধ অ্যাডমিনের পর্যালোচনার অপেক্ষায় আছে।";
    if (biodata.isFeatured && !biodata.featured_until)
        return "আপনার বায়োডাটা ইতিমধ্যে ফিচার্ড করা আছে।";
    return null;
};
const loadMember = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const [settings, user, biodata, pending] = yield Promise.all([
        getSettings(),
        user_info_model_1.UserInfoModel.findById(userId).select("email username user_id user_status").lean(),
        general_info_model_1.default.findOne({ user: userId }).select("biodata_status isFeatured featured_until").lean(),
        featured_request_model_1.FeaturedRequest.exists({ user: userId, status: "pending" }),
    ]);
    return { settings, user: user, biodata: biodata, pending: !!pending };
});
const getMine = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, exports.expireFeaturedBiodatas)();
    const { settings, user, biodata, pending } = yield loadMember(userId);
    const requests = yield featured_request_model_1.FeaturedRequest.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("status amount duration_days transaction_id admin_note refunded reviewed_at featured_until impressions clicks createdAt")
        .lean();
    const reason = blockReason(settings, user, biodata, pending);
    return {
        settings,
        can_request: !reason,
        reason,
        is_featured: !!(biodata === null || biodata === void 0 ? void 0 : biodata.isFeatured),
        featured_until: (biodata === null || biodata === void 0 ? void 0 : biodata.featured_until) || null,
        requests,
    };
});
// TODO: starts a bKash payment for the admin-set price; the amount never comes from the browser.
const startCheckout = (userId, callbackURL) => __awaiter(void 0, void 0, void 0, function* () {
    if (typeof callbackURL !== "string" || !/^https?:\/\//.test(callbackURL)) {
        throw new ApiError_1.default(400, "callbackURL is required");
    }
    const { settings, user, biodata, pending } = yield loadMember(userId);
    const reason = blockReason(settings, user, biodata, pending);
    if (reason)
        throw new ApiError_1.default(400, reason);
    const created = yield (0, createPayment_1.default)({ amount: settings.price, callbackURL });
    if (!(created === null || created === void 0 ? void 0 : created.paymentID) || !(created === null || created === void 0 ? void 0 : created.bkashURL)) {
        throw new ApiError_1.default(502, "বিকাশ পেমেন্ট শুরু করা যায়নি। আবার চেষ্টা করুন।");
    }
    yield bkash_intent_model_1.default.create({ payment_id: created.paymentID, user: userId, amount: settings.price, purpose: exports.FEATURED_PURPOSE });
    return { bkashURL: created.bkashURL, amount: settings.price, duration_days: settings.duration_days };
});
// TODO: called by bKash after-pay once a featured payment is Completed; insert-once by paymentID.
const recordPayment = (userId, email, paymentID, response) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const settings = yield getSettings();
    const existing = yield payment_model_1.default.findOneAndUpdate({ payment_id: paymentID }, {
        $setOnInsert: {
            email,
            points: 0,
            amount: response === null || response === void 0 ? void 0 : response.amount,
            transaction_id: response === null || response === void 0 ? void 0 : response.trxID,
            payment_id: paymentID,
            status: response === null || response === void 0 ? void 0 : response.transactionStatus,
            trnx_time: (response === null || response === void 0 ? void 0 : response.paymentCreateTime) || (response === null || response === void 0 ? void 0 : response.paymentExecuteTime),
            purpose: exports.FEATURED_PURPOSE,
        },
    }, { upsert: true, new: false }).lean();
    if (existing)
        return { alreadyRecorded: true, payment: existing };
    const [user, biodata] = yield Promise.all([
        user_info_model_1.UserInfoModel.findById(userId).select("username user_id").lean(),
        general_info_model_1.default.findOne({ user: userId }).select("_id").lean(),
    ]);
    const request = yield featured_request_model_1.FeaturedRequest.create({
        user: userId,
        biodata: biodata === null || biodata === void 0 ? void 0 : biodata._id,
        bio_user_id: user === null || user === void 0 ? void 0 : user.user_id,
        email,
        payment_id: paymentID,
        transaction_id: response === null || response === void 0 ? void 0 : response.trxID,
        amount: Number(response === null || response === void 0 ? void 0 : response.amount) || settings.price,
        duration_days: settings.duration_days,
    });
    notification_service_1.NotificationService.notify({
        recipient: userId,
        audience: "user",
        type: "payment",
        title: "ফিচার্ড অনুরোধ জমা হয়েছে",
        message: `৳${request.amount} পেমেন্ট সম্পন্ন হয়েছে। অ্যাডমিন অনুমোদন দিলে আপনার বায়োডাটা ${request.duration_days} দিনের জন্য ফিচার্ড হবে।`,
        link: "/user/account/featured",
    });
    notification_service_1.NotificationService.notify({
        audience: "admin",
        type: "payment",
        priority: "important",
        title: "নতুন ফিচার্ড অনুরোধ",
        message: `বায়োডাটা নং ${(_a = user === null || user === void 0 ? void 0 : user.user_id) !== null && _a !== void 0 ? _a : ""} ৳${request.amount} দিয়ে ফিচার্ড করার অনুরোধ করেছেন।`,
        link: "/featured-requests",
    });
    const mail = emailTemplates_1.emailTemplates.featuredRequested({
        name: user === null || user === void 0 ? void 0 : user.username,
        biodataNo: user === null || user === void 0 ? void 0 : user.user_id,
        amount: request.amount,
        days: request.duration_days,
        trxId: request.transaction_id,
    });
    (0, bibahoMail_1.mailUser)(email, mail.subject, mail.content);
    (0, bibahoMail_1.mailAdmins)("নতুন ফিচার্ড বায়োডাটা অনুরোধ", {
        icon: "bell",
        eyebrow: "অ্যাডমিন · ফিচার্ড",
        title: "নতুন ফিচার্ড বায়োডাটা অনুরোধ",
        paragraphs: ["একজন সদস্য পেমেন্ট করে তার বায়োডাটা ফিচার্ড করার অনুরোধ করেছেন। অ্যাডমিন প্যানেলের Featured Requests পেজ থেকে অনুমোদন বা বাতিল করুন।"],
        details: [
            { label: "বায়োডাটা নং", value: user === null || user === void 0 ? void 0 : user.user_id },
            { label: "ইমেইল", value: email },
            { label: "পরিমাণ", value: `৳${request.amount}` },
            { label: "মেয়াদ", value: `${request.duration_days} দিন` },
            { label: "ট্রানজেকশন আইডি", value: request.transaction_id },
        ],
    });
    return { alreadyRecorded: false, request };
});
// TODO: credits impressions/clicks to the running paid period of each biodata; admin-featured biodatas have none and are skipped.
const track = (biodataIds, event) => __awaiter(void 0, void 0, void 0, function* () {
    if (event !== "impression" && event !== "click")
        throw new ApiError_1.default(400, "Invalid event");
    const ids = [...new Set(Array.isArray(biodataIds) ? biodataIds : [])]
        .filter((id) => typeof id === "string" && (0, mongoose_1.isValidObjectId)(id))
        .slice(0, 24);
    const field = event === "click" ? "clicks" : "impressions";
    const now = new Date();
    yield Promise.all(ids.map((id) => featured_request_model_1.FeaturedRequest.findOneAndUpdate({ biodata: id, status: "approved", featured_until: { $gt: now } }, { $inc: { [field]: 1 } }, { sort: { featured_until: 1 } })));
});
const listAll = (status, page, limit) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, exports.expireFeaturedBiodatas)();
    const filter = {};
    if (typeof status === "string" && ["pending", "approved", "rejected"].includes(status))
        filter.status = status;
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.min(100, Math.max(1, Number(limit) || 20));
    const [data, total, pendingCount] = yield Promise.all([
        featured_request_model_1.FeaturedRequest.find(filter)
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber)
            .populate("biodata", "isFeatured featured_until biodata_status")
            .lean(),
        featured_request_model_1.FeaturedRequest.countDocuments(filter),
        featured_request_model_1.FeaturedRequest.countDocuments({ status: "pending" }),
    ]);
    return { data, total, page: pageNumber, limit: limitNumber, pending: pendingCount };
});
// TODO: atomically moves a pending request to its final status so two admins can't both act on it.
const claimPending = (id, status, note) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(0, mongoose_1.isValidObjectId)(id))
        throw new ApiError_1.default(400, "Invalid request id");
    const request = yield featured_request_model_1.FeaturedRequest.findOneAndUpdate({ _id: id, status: "pending" }, { status, admin_note: note, reviewed_at: new Date() }, { new: true });
    if (!request) {
        const exists = yield featured_request_model_1.FeaturedRequest.exists({ _id: id });
        throw new ApiError_1.default(exists ? 409 : 404, exists ? "This request was already reviewed" : "Request not found");
    }
    return request;
});
const cleanNote = (note) => (typeof note === "string" ? note.trim().slice(0, 500) : "");
const approve = (id, note) => __awaiter(void 0, void 0, void 0, function* () {
    const request = yield claimPending(id, "approved", cleanNote(note));
    const biodata = yield general_info_model_1.default.findById(request.biodata).select("isFeatured featured_until").lean();
    // TODO: renewals extend from the current end date instead of cutting it short.
    const currentEnd = (biodata === null || biodata === void 0 ? void 0 : biodata.isFeatured) && (biodata === null || biodata === void 0 ? void 0 : biodata.featured_until) ? new Date(biodata.featured_until).getTime() : 0;
    const until = new Date(Math.max(Date.now(), currentEnd) + request.duration_days * DAY);
    yield general_info_model_1.default.updateOne({ _id: request.biodata }, { $set: { isFeatured: true, featured_until: until } });
    request.featured_until = until;
    yield request.save();
    notification_service_1.NotificationService.notify({
        recipient: String(request.user),
        audience: "user",
        type: "biodata",
        title: "আপনার বায়োডাটা ফিচার্ড হয়েছে",
        message: `অভিনন্দন! আপনার বায়োডাটা হোমপেজে ফিচার্ড করা হয়েছে।`,
        link: "/user/account/featured",
    });
    const user = yield user_info_model_1.UserInfoModel.findById(request.user).select("username").lean();
    const mail = emailTemplates_1.emailTemplates.featuredApproved({ name: user === null || user === void 0 ? void 0 : user.username, biodataNo: request.bio_user_id, until });
    (0, bibahoMail_1.mailUser)(request.email, mail.subject, mail.content);
    return request;
});
const reject = (id, note, refund) => __awaiter(void 0, void 0, void 0, function* () {
    const request = yield claimPending(id, "rejected", cleanNote(note));
    if (refund === true || refund === "true") {
        try {
            yield (0, bkash_refund_1.processRefund)({ paymentID: request.payment_id, trxID: request.transaction_id, reason: "Featured request rejected" });
            request.refunded = true;
            yield request.save();
        }
        catch (error) {
            // TODO: keep the rejection but tell the admin the refund failed so they can retry from Payments.
            const message = error instanceof bkash_refund_1.RefundError ? error.message : "bKash refund failed";
            console.error("Featured refund failed:", error);
            throw new ApiError_1.default(502, `Request rejected, but the refund failed: ${message}. Refund it from the Payments page.`);
        }
    }
    notification_service_1.NotificationService.notify({
        recipient: String(request.user),
        audience: "user",
        type: "biodata",
        title: "ফিচার্ড অনুরোধ বাতিল হয়েছে",
        message: `${request.admin_note ? `কারণ: ${request.admin_note}। ` : ""}${request.refunded ? "আপনার টাকা বিকাশে ফেরত পাঠানো হয়েছে।" : ""}`,
        link: "/user/account/featured",
    });
    const user = yield user_info_model_1.UserInfoModel.findById(request.user).select("username").lean();
    const mail = emailTemplates_1.emailTemplates.featuredRejected({
        name: user === null || user === void 0 ? void 0 : user.username,
        reason: request.admin_note,
        refunded: request.refunded,
        amount: request.amount,
    });
    (0, bibahoMail_1.mailUser)(request.email, mail.subject, mail.content);
    return request;
});
exports.FeaturedRequestService = {
    getSettings,
    parseSettings,
    updateSettings: (data) => __awaiter(void 0, void 0, void 0, function* () {
        yield featured_request_model_1.FeaturedSettings.findOneAndUpdate({ key: "default" }, data, { upsert: true, setDefaultsOnInsert: true });
        return getSettings();
    }),
    getMine,
    startCheckout,
    recordPayment,
    track,
    listAll,
    approve,
    reject,
};
