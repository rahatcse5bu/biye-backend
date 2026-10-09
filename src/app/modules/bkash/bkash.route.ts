import express from "express";
import { bkashControllers } from "./bkash.controller";
import authCheck from "../../middlewares/authCheck";
import { auth } from "../../middlewares/auth";
const bkashRouter = express.Router();

bkashRouter.use(authCheck);

// User Part
bkashRouter.post("/create", auth("user", "admin"), bkashControllers.create);
bkashRouter.post("/after-pay", auth("user", "admin"), bkashControllers.afterPay);

// TODO: low-level bKash calls; the app runs them internally, so only admins may call them directly.
bkashRouter.post("/execute", auth("admin"), bkashControllers.execute);
bkashRouter.post("/query", auth("admin"), bkashControllers.query);

// Admin Part
bkashRouter.post("/search", auth("admin"), bkashControllers.search);
bkashRouter.post("/refund", auth("admin"), bkashControllers.refund);

export default bkashRouter;
