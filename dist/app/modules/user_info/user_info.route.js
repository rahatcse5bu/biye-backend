"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_info_controller_1 = require("./user_info.controller");
const userRouter = express_1.default.Router();
userRouter
    .route("/")
    .get(user_info_controller_1.UserInfoController.getUserInfo)
    .post(user_info_controller_1.UserInfoController.createUserInfo);
userRouter.route("/email/:email").get(user_info_controller_1.UserInfoController.getUserInfoByEmail);
userRouter
    .route("/create-login-user")
    .post(user_info_controller_1.UserInfoController.createUserForGoogleSignIn);
userRouter
    .route("/:id")
    .delete(user_info_controller_1.UserInfoController.deleteUserInfo)
    .put(user_info_controller_1.UserInfoController.updateUserInfo)
    .get(user_info_controller_1.UserInfoController.getSingleUserInfo);
exports.default = userRouter;
