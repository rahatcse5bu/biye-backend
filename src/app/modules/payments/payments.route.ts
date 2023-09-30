import express from "express";
import { PaymentsController } from "./payments.controller";
const PaymentsRouter = express.Router();

PaymentsRouter.route("/")
  .get(PaymentsController.getPayments)
  .post(PaymentsController.createPayments);

PaymentsRouter.route("/:id")
  .get(PaymentsController.getSinglePayments)
  .put(PaymentsController.updatePayments)
  .delete(PaymentsController.deletePayments);

export default PaymentsRouter;
