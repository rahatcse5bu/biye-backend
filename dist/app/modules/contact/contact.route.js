"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const contact_controller_1 = require("./contact.controller");
const auth_1 = require("../../middlewares/auth");
const ContactRouter = express_1.default.Router();
ContactRouter.route("/")
    .get(contact_controller_1.ContactController.getContact)
    .post((0, auth_1.auth)("user", "admin"), contact_controller_1.ContactController.createContact)
    .put((0, auth_1.auth)("user", "admin"), contact_controller_1.ContactController.updateContact);
ContactRouter.route("/:id/user-id").get(contact_controller_1.ContactController.getContactByUserId);
ContactRouter.route("/:id")
    .get(contact_controller_1.ContactController.getSingleContact)
    .delete(contact_controller_1.ContactController.deleteContact);
exports.default = ContactRouter;
