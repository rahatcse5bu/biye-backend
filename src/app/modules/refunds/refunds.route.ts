import express from "express";
import {  RefundController } from "./refunds.controller";
import { auth } from "../../middlewares/auth";
const RefundsRouter = express.Router();

RefundsRouter.route("/")
	.get(auth("user", "admin"), RefundController.getRefundList)
	.post(auth("user", "admin"), RefundController.addRefundRequest);

// RefundsRouter.route("/refund-req/").get(
// 	RefundController.getRefundByUserId
// );
// RefundsRouter.route("/bio-data/:id")
// 	.get(RefundController.getFavouritesCountByBioId)
// 	.put(RefundController.updateRefund)
// 	.delete(RefundController.deleteFavourites);
    RefundsRouter.route("/refund-req/").get(RefundController.getRefundList)
	.post(RefundController.addRefundRequest);
export default RefundsRouter;
