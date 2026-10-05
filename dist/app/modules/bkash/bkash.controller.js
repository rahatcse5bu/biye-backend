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
const axios_1 = __importDefault(require("axios"));
const url_1 = require("../../../shared/url");
const user_info_model_1 = require("../user_info/user_info.model");
const payment_model_1 = __importDefault(require("../payments/payment.model"));
const bibahoMail_1 = require("../../../shared/bibahoMail");
const notification_service_1 = require("../notifications/notification.service");
const points_package_service_1 = require("../points_package/points_package.service");
const bkash_refund_1 = require("./bkash.refund");
// Function to call the bKash execute payment API
function BkashExecutePaymentAPICall(paymentID) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.post(`${url_1.baseUrl}/bkash/execute`, {
                paymentID,
            });
            return response.data;
        }
        catch (error) {
            console.error("An error occurred during payment execution:", error);
            throw error;
        }
    });
}
// Function to call the bKash query payment API
function BkashQueryPaymentAPICall(paymentID) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.post(`${url_1.baseUrl}/bkash/query`, { paymentID });
            return response.data;
        }
        catch (error) {
            console.error("An error occurred during payment querying:", error);
            throw error;
        }
    });
}
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const createResult = yield (0, createPayment_1.default)(req.body); // pass amount & callbackURL from frontend
        console.log("create payment~", createResult);
        res.json(createResult);
    }
    catch (e) {
        console.log(e);
    }
});
const execute = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let executeResponse = yield (0, executePayment_1.default)(req.body.paymentID);
        res.json(executeResponse);
    }
    catch (e) {
        console.log(e);
    }
});
const query = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let queryResponse = yield (0, queryPayment_1.default)(req.body.paymentID);
        res.json(queryResponse);
    }
    catch (e) {
        console.log(e);
    }
});
const search = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.send(yield (0, searchTransaction_1.default)(req.body.trxID));
    }
    catch (e) {
        console.log(e);
    }
});
const afterPay = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { paymentID, email, purpose } = req.body;
    try {
        // Execute payment
        let response = yield BkashExecutePaymentAPICall(paymentID);
        // Query payment if there is a message in the response
        if (response === null || response === void 0 ? void 0 : response.message) {
            response = yield BkashQueryPaymentAPICall(paymentID);
        }
        if ((response === null || response === void 0 ? void 0 : response.statusCode) && response.statusCode === "0000") {
            const singleUser = yield user_info_model_1.UserInfoModel.findOne({ email });
            let saveInDb = false;
            let points = 0;
            if (singleUser) {
                // TODO: admin pricing only for the points page; contact top-ups keep the fixed 1.2x.
                const paidAmount = Number(response === null || response === void 0 ? void 0 : response.amount);
                points =
                    purpose === "buy_package"
                        ? yield points_package_service_1.PointsPackageService.pointsForAmount(paidAmount)
                        : paidAmount * 1.2;
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
                        status: existing.status,
                        payment_create_time: existing.trnx_time,
                    });
                }
                yield user_info_model_1.UserInfoModel.updateOne({ _id: singleUser._id }, { $inc: { points } });
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
                (0, bibahoMail_1.mailUser)(email, "পয়েন্ট কেনা সফল হয়েছে", {
                    title: "পয়েন্ট কেনা সফল হয়েছে",
                    tone: "success",
                    paragraphs: [
                        `ধন্যবাদ! আপনার পেমেন্ট সম্পন্ন হয়েছে এবং আপনার অ্যাকাউন্টে <strong>${points} পয়েন্ট</strong> যোগ হয়েছে।`,
                        "পেমেন্টের ৩ দিনের মধ্যে আপনার পেমেন্ট হিস্টোরি থেকে রিফান্ড অনুরোধ করা যাবে।",
                    ],
                    details: [
                        { label: "পরিমাণ", value: (0, bibahoMail_1.formatTaka)(response === null || response === void 0 ? void 0 : response.amount) },
                        { label: "যোগ হওয়া পয়েন্ট", value: points },
                        { label: "ট্রানজেকশন আইডি", value: response === null || response === void 0 ? void 0 : response.trxID },
                        { label: "সময়", value: (response === null || response === void 0 ? void 0 : response.paymentCreateTime) || (response === null || response === void 0 ? void 0 : response.paymentExecuteTime) },
                    ],
                    action: { label: "পেমেন্ট হিস্টোরি দেখুন", path: "/user/account/payment-and-refund" },
                });
            }
            res.json({
                success: true,
                statusMessage: response === null || response === void 0 ? void 0 : response.statusMessage,
                trxID: response === null || response === void 0 ? void 0 : response.trxID,
                saveInDb,
                paymentId: paymentID,
                amount: response === null || response === void 0 ? void 0 : response.amount,
                points,
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
            .json({ success: false, message: "An error occurred", error });
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
