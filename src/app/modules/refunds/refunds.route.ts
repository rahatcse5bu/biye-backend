import express from "express";
import { RefundController } from "./refunds.controller";
import { auth } from "../../middlewares/auth";

const RefundsRouter = express.Router();

RefundsRouter.route("/refund-req")
	.get(auth("admin"), RefundController.getRefundList)
	.post(auth("user", "admin"), RefundController.addRefundRequest)
	.put(auth("admin"), RefundController.updateRefundRequest);

export default RefundsRouter;
