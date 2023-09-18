"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_token_controller_1 = require("./user_token.controller");
const userTokenRouter = express_1.default.Router();
userTokenRouter
    .route("/create-token/:tokenId")
    .get(user_token_controller_1.UserTokenControllers.getUserToken);
exports.default = userTokenRouter;
