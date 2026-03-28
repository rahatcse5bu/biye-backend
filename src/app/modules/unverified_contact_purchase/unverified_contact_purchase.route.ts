import express from "express";
import { UnverifiedContactPurchaseController } from "./unverified_contact_purchase.controller";
import { auth } from "../../middlewares/auth";

const UnverifiedContactPurchaseRouter = express.Router();

// User: Get my purchases
UnverifiedContactPurchaseRouter.get(
  "/",
  auth("user", "admin"),
  UnverifiedContactPurchaseController.getMyPurchases
);

// User: Get single purchase
UnverifiedContactPurchaseRouter.get(
  "/:id",
  auth("user", "admin"),
  UnverifiedContactPurchaseController.getPurchaseById
);

export default UnverifiedContactPurchaseRouter;
