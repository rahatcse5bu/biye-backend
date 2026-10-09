import express from "express";
import { auth } from "../../middlewares/auth";
import { PaymentController } from "./payments.controller";
const PaymentsRouter = express.Router();

// TODO: users only ever see their own history (/token); every by-id or write route is admin-only.
PaymentsRouter.route("/")
  .get(auth("admin"), PaymentController.getAllPayments)
  .post(auth("admin"), PaymentController.createPayment);

PaymentsRouter.route("/token").get(
  auth("user", "admin"),
  PaymentController.getPaymentByToken
);
PaymentsRouter.route("/:id")
  .get(auth("admin"), PaymentController.getPaymentById)
  .put(auth("admin"), PaymentController.updatePayment)
  .delete(auth("admin"), PaymentController.deletePayment);

export default PaymentsRouter;
