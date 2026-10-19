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
exports.bkashControllers = void 0;
const createPayment_1 = __importDefault(require("../../../helpers/createPayment"));
const queryPayment_1 = __importDefault(require("../../../helpers/queryPayment"));
const searchTransaction_1 = __importDefault(require("../../../helpers/searchTransaction"));
const executePayment_1 = __importDefault(require("../../../helpers/executePayment"));
const user_info_model_1 = require("../user_info/user_info.model");
const payment_model_1 = __importDefault(require("../payments/payment.model"));
const bibahoMail_1 = require("../../../shared/bibahoMail");
const emailTemplates_1 = require("../../../shared/emailTemplates");
const notification_service_1 = require("../notifications/notification.service");
const points_package_service_1 = require("../points_package/points_package.service");
const bkash_refund_1 = require("./bkash.refund");
const bkash_intent_model_1 = __importDefault(require("./bkash_intent.model"));
const featured_request_service_1 = require("../featured_request/featured_request.service");
// TODO: every bKash handler must answer, otherwise the browser waits until it times out.
const bkashFailed = (res, error) => {
    console.error("bKash request failed:", error);
    res.status(502).json({ success: false, message: "bKash request failed. Please try again." });
};
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const createResult = yield (0, createPayment_1.default)(req.body); // pass amount & callbackURL from frontend
        if (createResult === null || createResult === void 0 ? void 0 : createResult.paymentID) {
            yield bkash_intent_model_1.default.create({
                payment_id: createResult.paymentID,
                user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
                amount: Number((_b = req.body) === null || _b === void 0 ? void 0 : _b.amount) || undefined,
            });
        }
        res.json(createResult);
    }
    catch (e) {
        bkashFailed(res, e);
    }
});
const execute = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let executeResponse = yield (0, executePayment_1.default)(req.body.paymentID);
        res.json(executeResponse);
    }
    catch (e) {
        bkashFailed(res, e);
    }
});
const query = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let queryResponse = yield (0, queryPayment_1.default)(req.body.paymentID);
        res.json(queryResponse);
    }
    catch (e) {
        bkashFailed(res, e);
    }
});
const search = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.send(yield (0, searchTransaction_1.default)(req.body.trxID));
    }
    catch (e) {
        bkashFailed(res, e);
    }
});
const afterPay = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d, _e;
    const { paymentID, purpose } = req.body;
    try {
        // TODO: points always go to the logged-in buyer, never to an email named in the request.
        const buyer = yield user_info_model_1.UserInfoModel.findById((_c = req.user) === null || _c === void 0 ? void 0 : _c._id).select("email").lean();
        const email = buyer === null || buyer === void 0 ? void 0 : buyer.email;
        if (!email) {
            return res.status(401).json({ success: false, message: "You are not authorized" });
        }
        // TODO: only the account that started the payment may confirm it; checked before execute, so a mismatch is never charged.
        const notYours = {
            success: false,
            message: "এই পেমেন্টটি অন্য একটি অ্যাকাউন্ট থেকে শুরু করা হয়েছে। যে অ্যাকাউন্ট থেকে পেমেন্ট শুরু করেছিলেন সেটিতে লগইন করে আবার চেষ্টা করুন।",
        };
        if (typeof paymentID !== "string" || !paymentID) {
            return res.status(400).json({ success: false, message: "paymentID is required" });
        }
        const recorded = yield payment_model_1.default.findOne({ payment_id: paymentID }).select("email purpose").lean();
        if (recorded && recorded.email !== email) {
            return res.status(403).json(notYours);
        }
        const intent = yield bkash_intent_model_1.default.findOne({ payment_id: paymentID }).select("user purpose").lean();
        if (!recorded && (!intent || String(intent.user) !== String((_d = req.user) === null || _d === void 0 ? void 0 : _d._id))) {
            return res.status(403).json(notYours);
        }
        // TODO: the server decides a payment is for featuring (set at checkout), never the purpose sent by the browser.
        const isFeatured = (intent === null || intent === void 0 ? void 0 : intent.purpose) === featured_request_service_1.FEATURED_PURPOSE || (recorded === null || recorded === void 0 ? void 0 : recorded.purpose) === featured_request_service_1.FEATURED_PURPOSE;
        // Execute payment directly (no HTTP call back into this server)
        let response = yield (0, executePayment_1.default)(paymentID);
        // Query payment if there is a message in the response
        if (response === null || response === void 0 ? void 0 : response.message) {
            response = yield (0, queryPayment_1.default)(paymentID);
        }
        // TODO: query returns 0000 for unpaid "Initiated" payments too; only a Completed transaction earns points.
        if (isFeatured && (response === null || response === void 0 ? void 0 : response.statusCode) === "0000" && (response === null || response === void 0 ? void 0 : response.transactionStatus) === "Completed") {
            const result = yield featured_request_service_1.FeaturedRequestService.recordPayment(String((_e = req.user) === null || _e === void 0 ? void 0 : _e._id), email, paymentID, response);
            return res.json({
                success: true,
                alreadyRecorded: result.alreadyRecorded,
                purpose: featured_request_service_1.FEATURED_PURPOSE,
                trxID: response === null || response === void 0 ? void 0 : response.trxID,
                paymentId: paymentID,
                amount: response === null || response === void 0 ? void 0 : response.amount,
                points: 0,
                status: response === null || response === void 0 ? void 0 : response.transactionStatus,
                payment_create_time: (response === null || response === void 0 ? void 0 : response.paymentCreateTime) || (response === null || response === void 0 ? void 0 : response.paymentExecuteTime),
            });
        }
        if ((response === null || response === void 0 ? void 0 : response.statusCode) === "0000" && (response === null || response === void 0 ? void 0 : response.transactionStatus) === "Completed") {
            const singleUser = yield user_info_model_1.UserInfoModel.findOne({ email });
            let saveInDb = false;
            let points = 0;
            // TODO: the buyer's balance after this payment, so the site can update it without refetching.
            let pointsBalance = singleUser ? Number(singleUser.points) || 0 : null;
            if (singleUser) {
                // TODO: points page uses package/custom pricing; purchase top-ups use the same admin rate the frontend priced them with.
                const paidAmount = Number(response === null || response === void 0 ? void 0 : response.amount);
                points =
                    purpose === "buy_package"
                        ? yield points_package_service_1.PointsPackageService.pointsForAmount(paidAmount)
                        : yield points_package_service_1.PointsPackageService.topUpPointsForAmount(paidAmount);
                // TODO: insert-once by paymentID so a page refresh or repeat call never credits twice.
                const existing = yield payment_model_1.default.findOneAndUpdate({ payment_id: paymentID }, {
                    $setOnInsert: {
                        email,
                        points,
                        amount: response === null || response === void 0 ? void 0 : response.amount,
                        transaction_id: response === null || response === void 0 ? void 0 : response.trxID,
                        payment_id: paymentID,
                        status: response === null || response === void 0 ? void 0 : response.transactionStatus,
                        trnx_time: (response === null || response === void 0 ? void 0 : response.paymentCreateTime) || (response === null || response === void 0 ? void 0 : response.paymentExecuteTime),
                        purpose,
                    },
                }, { upsert: true, new: false }).lean();
                if (existing) {
                    return res.json({
                        success: true,
                        alreadyRecorded: true,
                        trxID: existing.transaction_id,
                        paymentId: paymentID,
                        amount: existing.amount,
                        points: existing.points,
                        points_balance: pointsBalance,
                        status: existing.status,
                        payment_create_time: existing.trnx_time,
                    });
                }
                const credited = yield user_info_model_1.UserInfoModel.findOneAndUpdate({ _id: singleUser._id }, { $inc: { points } }, { new: true })
                    .select("points")
                    .lean();
                pointsBalance = Number(credited === null || credited === void 0 ? void 0 : credited.points) || 0;
                saveInDb = true;
                notification_service_1.NotificationService.notify({
                    recipient: singleUser._id,
                    audience: "user",
                    type: "payment",
                    title: "পেমেন্ট সফল",
                    message: `৳${response === null || response === void 0 ? void 0 : response.amount} পেমেন্ট সম্পন্ন হয়েছে। আপনার অ্যাকাউন্টে ${points} পয়েন্ট যোগ হয়েছে।`,
                    link: "/user/account/dashboard",
                });
                notification_service_1.NotificationService.notify({
                    audience: "admin",
                    type: "payment",
                    title: "নতুন পেমেন্ট",
                    message: `${email} ৳${response === null || response === void 0 ? void 0 : response.amount} পেমেন্ট করেছেন (TrxID: ${response === null || response === void 0 ? void 0 : response.trxID})।`,
                    link: "/payments",
                });
                const receipt = emailTemplates_1.emailTemplates.paymentSuccess({
                    name: singleUser.username,
                    amount: response === null || response === void 0 ? void 0 : response.amount,
                    points,
                    balance: pointsBalance,
                    trxId: response === null || response === void 0 ? void 0 : response.trxID,
                    paidAt: (response === null || response === void 0 ? void 0 : response.paymentExecuteTime) || (response === null || response === void 0 ? void 0 : response.paymentCreateTime),
                });
                (0, bibahoMail_1.mailUser)(email, receipt.subject, receipt.content);
            }
            res.json({
                success: true,
                statusMessage: response === null || response === void 0 ? void 0 : response.statusMessage,
                trxID: response === null || response === void 0 ? void 0 : response.trxID,
                saveInDb,
                paymentId: paymentID,
                amount: response === null || response === void 0 ? void 0 : response.amount,
                points,
                points_balance: pointsBalance,
                status: response === null || response === void 0 ? void 0 : response.transactionStatus,
                payment_create_time: (response === null || response === void 0 ? void 0 : response.paymentCreateTime) || (response === null || response === void 0 ? void 0 : response.paymentExecuteTime),
            });
        }
        else {
            res.json({
                success: false,
                message: response === null || response === void 0 ? void 0 : response.statusMessage,
            });
        }
    }
    catch (error) {
        console.error("An error occurred:", error);
        res
            .status(500)
            .json({ success: false, message: "Payment could not be confirmed. If money was deducted, contact support with your TrxID." });
    }
});
const refund = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.json(yield (0, bkash_refund_1.processRefund)(req.body || {}));
    }
    catch (error) {
        const statusCode = error instanceof bkash_refund_1.RefundError ? error.statusCode : 500;
        if (statusCode === 500)
            console.error("bKash refund failed:", error);
        res.status(statusCode).json({
            success: false,
            message: statusCode === 500 ? "Refund failed" : error.message,
        });
    }
});
exports.bkashControllers = {
    create,
    refund,
    search,
    execute,
    query,
    afterPay,
};
