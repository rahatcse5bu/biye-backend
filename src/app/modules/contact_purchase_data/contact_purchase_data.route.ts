import express from "express";
import { auth } from "../../middlewares/auth";
import { ContactPurchaseDataController } from "./contact_purchase_data.controller";
const ContactPurchaseDataRouter = express.Router();

ContactPurchaseDataRouter.route("/").post(
	auth("user", "admin"),
	ContactPurchaseDataController.createContactPurchaseData
);

export default ContactPurchaseDataRouter;
