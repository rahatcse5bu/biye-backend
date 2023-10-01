import express from "express";
import { ContactController } from "./contact.controller";
import { auth } from "../../middlewares/auth";
const ContactRouter = express.Router();

ContactRouter.route("/")
	.get(ContactController.getContact)
	.post(auth("user", "admin"), ContactController.createContact)
	.put(auth("user", "admin"), ContactController.updateContact);

ContactRouter.route("/:id/user-id").get(ContactController.getContactByUserId);
ContactRouter.route("/:id")
	.get(ContactController.getSingleContact)
	.delete(ContactController.deleteContact);

export default ContactRouter;
