import express from "express";
import { ExpectedLifePartnerController } from "./expected_lifepartner.controller";
const ExpectedLifePartnerRouter = express.Router();

ExpectedLifePartnerRouter.route("/")
  .get(ExpectedLifePartnerController.getExpectedLifePartner)
  .post(ExpectedLifePartnerController.createExpectedLifePartner);

ExpectedLifePartnerRouter.route("/:id")
  .get(ExpectedLifePartnerController.getSingleExpectedLifePartner)
  .put(ExpectedLifePartnerController.updateExpectedLifePartner)
  .delete(ExpectedLifePartnerController.deleteExpectedLifePartner);

export default ExpectedLifePartnerRouter;
