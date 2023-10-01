import express from "express";
import { ExpectedLifePartnerController } from "./expected_lifepartner.controller";
import { auth } from "../../middlewares/auth";
const ExpectedLifePartnerRouter = express.Router();

ExpectedLifePartnerRouter.route("/")
	.get(ExpectedLifePartnerController.getExpectedLifePartner)
	.post(
		auth("user", "admin"),
		ExpectedLifePartnerController.createExpectedLifePartner
	)
	.put(
		auth("user", "admin"),
		ExpectedLifePartnerController.updateExpectedLifePartner
	);

ExpectedLifePartnerRouter.route("/:id/user-id").get(
	ExpectedLifePartnerController.getExpectedLifePartnerByUserId
);
ExpectedLifePartnerRouter.route("/:id")
	.get(ExpectedLifePartnerController.getSingleExpectedLifePartner)
	.delete(ExpectedLifePartnerController.deleteExpectedLifePartner);

export default ExpectedLifePartnerRouter;
