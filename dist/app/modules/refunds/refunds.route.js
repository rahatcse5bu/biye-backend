"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const refunds_controller_1 = require("./refunds.controller");
const auth_1 = require("../../middlewares/auth");
const RefundsRouter = express_1.default.Router();
RefundsRouter.route("/refund-req")
    .get((0, auth_1.auth)("admin"), refunds_controller_1.RefundController.getRefundList)
    .post((0, auth_1.auth)("user", "admin"), refunds_controller_1.RefundController.addRefundRequest)
    .put((0, auth_1.auth)("admin"), refunds_controller_1.RefundController.updateRefundRequest);
exports.default = RefundsRouter;
