"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const payments_controller_1 = require("./payments.controller");
const PaymentsRouter = express_1.default.Router();
PaymentsRouter.route("/")
    .get(payments_controller_1.PaymentsController.getPayments)
    .post(payments_controller_1.PaymentsController.createPayments);
PaymentsRouter.route("/:id")
    .get(payments_controller_1.PaymentsController.getSinglePayments)
    .put(payments_controller_1.PaymentsController.updatePayments)
    .delete(payments_controller_1.PaymentsController.deletePayments);
exports.default = PaymentsRouter;
