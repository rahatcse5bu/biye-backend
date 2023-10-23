"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const refunds_controller_1 = require("./refunds.controller");
const auth_1 = require("../../middlewares/auth");
const RefundsRouter = express_1.default.Router();
// GET request to retrieve refunds
RefundsRouter.get("/refund-req", refunds_controller_1.RefundController.getRefundList);
// POST request to add a refund request
RefundsRouter.post("/refund-req", (0, auth_1.auth)("user", "admin"), refunds_controller_1.RefundController.addRefundRequest);
exports.default = RefundsRouter;
