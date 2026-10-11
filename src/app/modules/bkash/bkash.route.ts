import express from "express";
import { bkashControllers } from "./bkash.controller";
import authCheck from "../../middlewares/authCheck";
import { auth } from "../../middlewares/auth";
const bkashRouter = express.Router();

// TODO: auth runs first so anonymous requests never trigger a bKash token grant.

// User Part
bkashRouter.post("/create", auth("user", "admin"), authCheck, bkashControllers.create);
bkashRouter.post("/after-pay", auth("user", "admin"), authCheck, bkashControllers.afterPay);

// TODO: low-level bKash calls; the app runs them internally, so only admins may call them directly.
bkashRouter.post("/execute", auth("admin"), authCheck, bkashControllers.execute);
bkashRouter.post("/query", auth("admin"), authCheck, bkashControllers.query);

// Admin Part
bkashRouter.post("/search", auth("admin"), authCheck, bkashControllers.search);
bkashRouter.post("/refund", auth("admin"), authCheck, bkashControllers.refund);

export default bkashRouter;
