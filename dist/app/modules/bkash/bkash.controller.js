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
const refundTransaction_1 = __importDefault(require("../../../helpers/refundTransaction"));
const executePayment_1 = __importDefault(require("../../../helpers/executePayment"));
const axios_1 = __importDefault(require("axios"));
const url_1 = require("../../../shared/url");
const user_info_model_1 = require("../user_info/user_info.model");
const payment_model_1 = __importDefault(require("../payments/payment.model"));
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
    const { paymentID, user } = req.body;
    try {
        // Execute payment
        let response = yield BkashExecutePaymentAPICall(paymentID);
        // Query payment if there is a message in the response
        if (response === null || response === void 0 ? void 0 : response.message) {
            response = yield BkashQueryPaymentAPICall(paymentID);
        }
        if ((response === null || response === void 0 ? void 0 : response.statusCode) && response.statusCode === "0000") {
            const singleUser = yield user_info_model_1.UserInfoModel.findById(user);
            let saveInDb = false;
            if (singleUser) {
                // add payment to DB;
                const points = (response === null || response === void 0 ? void 0 : response.amount) * 1.2;
                yield payment_model_1.default.create({
                    user,
                    points,
                    amount: response === null || response === void 0 ? void 0 : response.amount,
                    transaction_id: response === null || response === void 0 ? void 0 : response.trxID,
                    payment_id: paymentID,
                    status: response === null || response === void 0 ? void 0 : response.transactionStatus,
                    trnx_time: (response === null || response === void 0 ? void 0 : response.paymentCreateTime) || (response === null || response === void 0 ? void 0 : response.paymentExecuteTime),
                });
                // updated points of the user
                singleUser.points = singleUser.points + points;
                yield singleUser.save();
                saveInDb = true;
            }
            res.json({
                success: true,
                statusMessage: response === null || response === void 0 ? void 0 : response.statusMessage,
                trxID: response === null || response === void 0 ? void 0 : response.trxID,
                saveInDb,
                paymentId: paymentID,
                amount: response === null || response === void 0 ? void 0 : response.amount,
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
        const refundStatusBody = {
            paymentID: req.body.paymentID,
            trxID: req.body.trxID,
        };
        const refundStatusResponse = yield (0, refundTransaction_1.default)(refundStatusBody);
        if (refundStatusResponse === null || refundStatusResponse === void 0 ? void 0 : refundStatusResponse.refundTrxID) {
            console.log("status");
            res.send(refundStatusResponse);
        }
        else {
            console.log("refund");
            res.send(yield (0, refundTransaction_1.default)(req.body));
        }
    }
    catch (e) {
        console.log(e);
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
