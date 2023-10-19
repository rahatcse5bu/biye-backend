"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bkash_controller_1 = require("./bkash.controller");
const authCheck_1 = __importDefault(require("../../middlewares/authCheck"));
const bkashRouter = express_1.default.Router();
bkashRouter.use(authCheck_1.default);
// User Part
bkashRouter.post("/create", bkash_controller_1.bkashControllers.create);
bkashRouter.post("/execute", bkash_controller_1.bkashControllers.execute);
bkashRouter.post("/query", bkash_controller_1.bkashControllers.query);
// Admin Part
bkashRouter.post("/search", bkash_controller_1.bkashControllers.search);
bkashRouter.post("/refund", bkash_controller_1.bkashControllers.refund);
exports.default = bkashRouter;
