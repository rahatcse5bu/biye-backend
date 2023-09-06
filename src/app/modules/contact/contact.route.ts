import express from "express";
import { ContactController } from "./contact.controller";
const ContactRouter = express.Router();

ContactRouter.route("/")
  .get(ContactController.getContact)
  .post(ContactController.createContact);

ContactRouter.route("/:id")
  .get(ContactController.getSingleContact)
  .put(ContactController.updateContact)
  .delete(ContactController.deleteContact);

export default ContactRouter;
