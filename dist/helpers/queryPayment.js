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
const isomorphic_fetch_1 = __importDefault(require("isomorphic-fetch"));
const node_global_storage_1 = require("node-global-storage");
const authHeaders_1 = __importDefault(require("./authHeaders"));
const queryPayment = (paymentID) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("query start !!");
    const queryResponse = yield (0, isomorphic_fetch_1.default)((0, node_global_storage_1.get)("bkash_base_url") + "/checkout/payment/status", {
        method: "POST",
        headers: yield (0, authHeaders_1.default)(),
        body: JSON.stringify({
            paymentID,
        }),
    });
    const queryResult = yield queryResponse.json();
    return queryResult;
});
exports.default = queryPayment;
