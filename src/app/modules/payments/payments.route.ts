import express from "express";
import { auth } from "../../middlewares/auth";
import { PaymentController } from "./payments.controller";
const PaymentsRouter = express.Router();

PaymentsRouter.route("/")
  .get(auth("user", "admin"), PaymentController.getAllPayments)
  .post(auth("user", "admin"), PaymentController.createPayment);

PaymentsRouter.route("/token").get(
  auth("user", "admin"),
  PaymentController.getPaymentByToken
);
PaymentsRouter.route("/:id")
  .get(auth("user", "admin"), PaymentController.getPaymentById)
  .put(auth("user", "admin"), PaymentController.updatePayment)
  .delete(auth("user", "admin"), PaymentController.deletePayment);

export default PaymentsRouter;
