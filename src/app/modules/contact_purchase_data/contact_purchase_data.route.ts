import express from "express";
import { auth } from "../../middlewares/auth";
import { ContactPurchaseController } from "./contact_purchase_data.controller";
const ContactPurchaseDataRouter = express.Router();

ContactPurchaseDataRouter.route("/").post(
  auth("user", "admin"),
  ContactPurchaseController.createContactPurchase
);

export default ContactPurchaseDataRouter;
