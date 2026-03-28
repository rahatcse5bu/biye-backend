"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const unverified_contact_purchase_controller_1 = require("./unverified_contact_purchase.controller");
const auth_1 = require("../../middlewares/auth");
const UnverifiedContactPurchaseRouter = express_1.default.Router();
// User: Get my purchases
UnverifiedContactPurchaseRouter.get("/", (0, auth_1.auth)("user", "admin"), unverified_contact_purchase_controller_1.UnverifiedContactPurchaseController.getMyPurchases);
// User: Get single purchase
UnverifiedContactPurchaseRouter.get("/:id", (0, auth_1.auth)("user", "admin"), unverified_contact_purchase_controller_1.UnverifiedContactPurchaseController.getPurchaseById);
exports.default = UnverifiedContactPurchaseRouter;
