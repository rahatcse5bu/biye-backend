import express from "express";
import { FavouritesController as RefundController } from "./refunds.controller";
import { auth } from "../../middlewares/auth";
const RefundsRouter = express.Router();

RefundsRouter.route("/")
	.get(auth("user", "admin"), RefundController.getAllRefunds)
	.post(auth("user", "admin"), RefundController.addRefundRequest);

// RefundsRouter.route("/refund-req/").get(
// 	RefundController.getRefundByUserId
// );
// RefundsRouter.route("/bio-data/:id")
// 	.get(RefundController.getFavouritesCountByBioId)
// 	.put(RefundController.updateRefund)
// 	.delete(RefundController.deleteFavourites);
    RefundsRouter.route("/refund-req/").get(RefundController.getAllRefunds)
	.post(RefundController.addRefundRequest);
export default RefundsRouter;
