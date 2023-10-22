import express from "express";
import { RefundController } from "./refunds.controller";
import { auth } from "../../middlewares/auth";

const RefundsRouter = express.Router();

// GET request to retrieve refunds
RefundsRouter.get("/refund-req", RefundController.getRefundList);

// POST request to add a refund request
RefundsRouter.post("/refund-req", RefundController.addRefundRequest);

export default RefundsRouter;