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
exports.processRefund = exports.RefundError = void 0;
const configSetup_1 = __importDefault(require("../../../helpers/configSetup"));
const grantToken_1 = __importDefault(require("../../../helpers/grantToken"));
const refundTransaction_1 = __importDefault(require("../../../helpers/refundTransaction"));
const payment_model_1 = __importDefault(require("../payments/payment.model"));
const user_info_model_1 = require("../user_info/user_info.model");
const refund_request_model_1 = __importDefault(require("../refund_request/refund_request.model"));
const notification_service_1 = require("../notifications/notification.service");
const bibahoMail_1 = require("../../../shared/bibahoMail");
class RefundError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.RefundError = RefundError;
const isRefunded = (result) => Boolean(result === null || result === void 0 ? void 0 : result.refundTrxID) && (result === null || result === void 0 ? void 0 : result.transactionStatus) === "Completed";
// TODO: refunds the full amount, or a pending user request's amount; marks the payment Refunded and takes back its points.
const processRefund = (input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const paymentID = typeof input.paymentID === "string" ? input.paymentID.trim() : "";
    const trxID = typeof input.trxID === "string" ? input.trxID.trim() : "";
    if (!paymentID || !trxID) {
        throw new RefundError(400, "paymentID and trxID are required");
    }
    const payment = yield payment_model_1.default.findOne({ transaction_id: trxID });
    if (payment && payment.payment_id && payment.payment_id !== paymentID) {
        throw new RefundError(400, "paymentID does not match this transaction");
    }
    if ((payment === null || payment === void 0 ? void 0 : payment.status) === "Refunded") {
        throw new RefundError(409, "This payment is already refunded");
    }
    // TODO: a pending user request already holds the points and fixes the refund amount.
    const request = payment
        ? yield refund_request_model_1.default.findOne({ payment: payment._id, status: "requested" }).lean()
        : null;
    const expectedAmount = request ? request.refund_amount : payment === null || payment === void 0 ? void 0 : payment.amount;
    const amount = Number((_a = input.amount) !== null && _a !== void 0 ? _a : expectedAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new RefundError(400, "A valid refund amount is required");
    }
    if (payment && Number(expectedAmount) !== amount) {
        throw new RefundError(400, request
            ? `This payment has a pending refund request. Refund amount must be ৳${expectedAmount}`
            : `Partial refunds are not supported. Refund amount must be ৳${expectedAmount}`);
    }
    yield (0, configSetup_1.default)();
    yield (0, grantToken_1.default)();
    // TODO: bKash returns the earlier refund here when this trx was already refunded.
    let result = yield (0, refundTransaction_1.default)({ paymentID, trxID });
    if (!isRefunded(result)) {
        result = yield (0, refundTransaction_1.default)({
            paymentID,
            trxID,
            amount: String(amount),
            sku: "points",
            reason: typeof input.reason === "string" && input.reason.trim()
                ? input.reason.trim()
                : "Admin refund",
        });
    }
    if (!isRefunded(result)) {
        throw new RefundError(502, (result === null || result === void 0 ? void 0 : result.statusMessage) || (result === null || result === void 0 ? void 0 : result.errorMessage) || "bKash refund failed");
    }
    let pointsRemoved = 0;
    let pointsBalance = null;
    // TODO: atomic claim so a double click can't deduct points twice.
    const claimed = payment
        ? yield payment_model_1.default.findOneAndUpdate({ _id: payment._id, status: { $ne: "Refunded" } }, {
            status: "Refunded",
            refund_trx_id: result.refundTrxID,
            refunded_at: new Date(),
        })
        : null;
    const settledRequest = claimed && request
        ? yield refund_request_model_1.default.findOneAndUpdate({ _id: request._id, status: "requested" }, { status: "refunded", refund_trx_id: result.refundTrxID, processed_at: new Date() })
        : null;
    if (settledRequest) {
        pointsRemoved = request.points_held;
        pointsBalance =
            (_c = (_b = ((yield user_info_model_1.UserInfoModel.findOne({ email: payment.email }).select("points").lean()))) === null || _b === void 0 ? void 0 : _b.points) !== null && _c !== void 0 ? _c : null;
        notification_service_1.NotificationService.notify({
            recipient: String(request.user),
            audience: "user",
            type: "refund",
            title: "রিফান্ড সম্পন্ন",
            message: `আপনার ৳${amount} রিফান্ড বিকাশে পাঠানো হয়েছে (Refund TrxID: ${result.refundTrxID})।`,
            link: "/user/account/payment-and-refund",
        });
    }
    else if (claimed) {
        // TODO: removes all purchased points; balance may go negative if some were already spent.
        const user = yield user_info_model_1.UserInfoModel.findOneAndUpdate({ email: payment.email }, { $inc: { points: -(payment.points || 0) } }, { new: true })
            .select("points")
            .lean();
        if (user) {
            pointsRemoved = payment.points || 0;
            pointsBalance = (_d = user.points) !== null && _d !== void 0 ? _d : null;
        }
    }
    // TODO: one email per refund, sent only by the request that actually settled it.
    if (settledRequest || claimed) {
        (0, bibahoMail_1.mailUser)(payment.email, "রিফান্ড সম্পন্ন হয়েছে", {
            title: "আপনার রিফান্ড সম্পন্ন হয়েছে",
            tone: "success",
            paragraphs: [
                "আপনার পেমেন্টের রিফান্ড বিকাশের মাধ্যমে পাঠানো হয়েছে। টাকা আপনার বিকাশ অ্যাকাউন্টে পৌঁছাতে কিছু সময় লাগতে পারে।",
                `এই পেমেন্টের <strong>${pointsRemoved} পয়েন্ট</strong> আপনার অ্যাকাউন্ট থেকে সরিয়ে নেওয়া হয়েছে।`,
            ],
            details: [
                { label: "রিফান্ডের পরিমাণ", value: (0, bibahoMail_1.formatTaka)(amount) },
                { label: "রিফান্ড ট্রানজেকশন আইডি", value: result.refundTrxID },
                { label: "মূল ট্রানজেকশন আইডি", value: result.originalTrxID || trxID },
                { label: "বর্তমান পয়েন্ট", value: pointsBalance },
            ],
            action: { label: "পেমেন্ট হিস্টোরি দেখুন", path: "/user/account/payment-and-refund" },
        });
    }
    return {
        refundTrxID: result.refundTrxID,
        originalTrxID: result.originalTrxID || trxID,
        amount: result.amount || String(amount),
        transactionStatus: result.transactionStatus,
        paymentUpdated: Boolean(claimed),
        pointsRemoved,
        pointsBalance,
    };
});
exports.processRefund = processRefund;
