"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.amountToPoints = exports.PaymentsFields = void 0;
exports.PaymentsFields = [
    "transaction_id",
    "method",
    "user_id",
    "amount",
    "status",
    "bio_id",
    "trnx_time",
];
exports.amountToPoints = {
    30: "35",
    100: "120",
    300: "345",
    500: "560",
};
