"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const contact_controller_1 = require("./contact.controller");
const ContactRouter = express_1.default.Router();
ContactRouter.route("/")
    .get(contact_controller_1.ContactController.getContact)
    .post(contact_controller_1.ContactController.createContact);
ContactRouter.route("/:id")
    .get(contact_controller_1.ContactController.getSingleContact)
    .put(contact_controller_1.ContactController.updateContact)
    .delete(contact_controller_1.ContactController.deleteContact);
exports.default = ContactRouter;
