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
};
