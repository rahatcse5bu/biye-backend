"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middlewares/auth");
const contact_purchase_data_controller_1 = require("./contact_purchase_data.controller");
const ContactPurchaseDataRouter = express_1.default.Router();
ContactPurchaseDataRouter.route("/").post((0, auth_1.auth)("user", "admin"), contact_purchase_data_controller_1.ContactPurchaseController.createContactPurchase);
ContactPurchaseDataRouter.route("/admin/all").get((0, auth_1.auth)("admin"), contact_purchase_data_controller_1.ContactPurchaseController.getAllContactPurchasesByAdmin);
exports.default = ContactPurchaseDataRouter;
