import express from "express";
import { auth } from "../../middlewares/auth";
import { ExpectedPartnerController } from "./expected_lifepartner.controller";
const ExpectedLifePartnerRouter = express.Router();

ExpectedLifePartnerRouter.route("/")
  .get(ExpectedPartnerController.getAllExpectedPartners)
  .post(auth("user", "admin"), ExpectedPartnerController.createExpectedPartner)
  .put(auth("user", "admin"), ExpectedPartnerController.updateExpectedPartner);

ExpectedLifePartnerRouter.route("/token").get(
  auth("admin", "user"),
  ExpectedPartnerController.getExpectedPartnerByToken
);
ExpectedLifePartnerRouter.route("/:id")
  .get(auth("admin"), ExpectedPartnerController.getExpectedPartnerById)
  .delete(auth("admin"), ExpectedPartnerController.deleteExpectedPartner);

export default ExpectedLifePartnerRouter;
