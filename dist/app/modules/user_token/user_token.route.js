"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_token_controller_1 = require("./user_token.controller");
const auth_1 = require("../../middlewares/auth");
const userTokenRouter = express_1.default.Router();
userTokenRouter
    .route("/verify-token")
    .get((0, auth_1.auth)("user", "admin"), user_token_controller_1.UserTokenControllers.verifyJWT);
userTokenRouter
    .route("/create-token/:tokenId")
    .get(user_token_controller_1.UserTokenControllers.getUserToken);
exports.default = userTokenRouter;
