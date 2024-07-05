import express from "express";
import { bkashControllers } from "./bkash.controller";
import authCheck from "../../middlewares/authCheck";
const bkashRouter = express.Router();

bkashRouter.use(authCheck);

// User Part
bkashRouter.post("/create", bkashControllers.create);
bkashRouter.post("/execute", bkashControllers.execute);
bkashRouter.post("/query", bkashControllers.query);
bkashRouter.post("/after-pay", bkashControllers.afterPay);

// Admin Part
bkashRouter.post("/search", bkashControllers.search);
bkashRouter.post("/refund", bkashControllers.refund);

export default bkashRouter;
