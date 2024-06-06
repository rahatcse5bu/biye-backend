"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middlewares/auth");
const payments_controller_1 = require("./payments.controller");
const PaymentsRouter = express_1.default.Router();
PaymentsRouter.route("/")
    .get((0, auth_1.auth)("user", "admin"), payments_controller_1.PaymentController.getAllPayments)
    .post((0, auth_1.auth)("user", "admin"), payments_controller_1.PaymentController.createPayment);
PaymentsRouter.route("/token").get((0, auth_1.auth)("user", "admin"), payments_controller_1.PaymentController.getPaymentByToken);
PaymentsRouter.route("/:id")
    .get((0, auth_1.auth)("user", "admin"), payments_controller_1.PaymentController.getPaymentById)
    .put((0, auth_1.auth)("user", "admin"), payments_controller_1.PaymentController.updatePayment)
    .delete((0, auth_1.auth)("user", "admin"), payments_controller_1.PaymentController.deletePayment);
exports.default = PaymentsRouter;
