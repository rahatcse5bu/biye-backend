import express from "express";
import { PaymentsController } from "./payments.controller";
import { auth } from "../../middlewares/auth";
const PaymentsRouter = express.Router();

PaymentsRouter.route("/")
	.get(PaymentsController.getPayments)
	.post(auth("user", "admin"), PaymentsController.createPayments);

PaymentsRouter.route("/:id")
	.get(PaymentsController.getSinglePayments)
	.put(PaymentsController.updatePayments)
	.delete(PaymentsController.deletePayments);

export default PaymentsRouter;
