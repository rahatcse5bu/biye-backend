import express from "express";
import { ContactController } from "./contact.controller";
import { auth } from "../../middlewares/auth";
const ContactRouter = express.Router();

ContactRouter.route("/")
	.post(auth("user", "admin"), ContactController.createContact)
	.put(auth("user", "admin"), ContactController.updateContact);
ContactRouter.route("/bio-contact/:userId/:bioId").get(
	auth("user", "admin"),
	ContactController.getContactForBuyer
);

ContactRouter.route("/:id/user-id").get(
	auth("user", "admin"),
	ContactController.getContactByUserId
);

ContactRouter.route("/:id").delete(ContactController.deleteContact);

export default ContactRouter;
