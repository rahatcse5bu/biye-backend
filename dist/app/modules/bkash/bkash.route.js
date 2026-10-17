"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bkash_controller_1 = require("./bkash.controller");
const authCheck_1 = __importDefault(require("../../middlewares/authCheck"));
const auth_1 = require("../../middlewares/auth");
const bkashRouter = express_1.default.Router();
// TODO: auth runs first so anonymous requests never trigger a bKash token grant.
// User Part
bkashRouter.post("/create", (0, auth_1.auth)("user", "admin"), authCheck_1.default, bkash_controller_1.bkashControllers.create);
bkashRouter.post("/after-pay", (0, auth_1.auth)("user", "admin"), authCheck_1.default, bkash_controller_1.bkashControllers.afterPay);
// TODO: low-level bKash calls; the app runs them internally, so only admins may call them directly.
bkashRouter.post("/execute", (0, auth_1.auth)("admin"), authCheck_1.default, bkash_controller_1.bkashControllers.execute);
bkashRouter.post("/query", (0, auth_1.auth)("admin"), authCheck_1.default, bkash_controller_1.bkashControllers.query);
// Admin Part
bkashRouter.post("/search", (0, auth_1.auth)("admin"), authCheck_1.default, bkash_controller_1.bkashControllers.search);
bkashRouter.post("/refund", (0, auth_1.auth)("admin"), authCheck_1.default, bkash_controller_1.bkashControllers.refund);
exports.default = bkashRouter;
