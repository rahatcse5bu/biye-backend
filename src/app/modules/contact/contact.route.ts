import express from "express";
import { ContactController } from "./contact.controller";
import { auth } from "../../middlewares/auth";
import { rateLimit } from "../../../shared/rateLimit";
const ContactRouter = express.Router();

ContactRouter.route("/")
  .post(auth("user", "admin"), ContactController.createContact)
  .put(auth("user", "admin"), ContactController.updateContact);
// ContactRouter.route("/bio-contact/:userId/:bioId").get(
//   auth("user", "admin"),
//   ContactController.getContactForBuyer
// );
ContactRouter.route("/send-email").post(
  rateLimit({ name: "contact-us", windowMs: 60 * 60 * 1000, max: 5 }),
  ContactController.createContactUsByEmail
);

ContactRouter.route("/token").get(
  auth("user", "admin"),
  ContactController.getContactByToken
);

// ContactRouter.route("/:id").delete(ContactController.deleteContact);

export default ContactRouter;
