"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middlewares/auth");
const user_info_controller_1 = require("./user_info.controller");
const userRouter = express_1.default.Router();
userRouter.route("/").post(user_info_controller_1.UserInfoController.createUserInfo);
userRouter
    .route("/")
    .put((0, auth_1.auth)("user", "admin"), user_info_controller_1.UserInfoController.updateUserInfo);
userRouter.route("/status/:id").get(user_info_controller_1.UserInfoController.getUserStatus);
userRouter.route("/email/:email").get(user_info_controller_1.UserInfoController.getUserInfoByEmail);
userRouter
    .route("/create-login-user")
    .post(user_info_controller_1.UserInfoController.createUserForGoogleSignIn);
// userRouter.route("/:id").get(UserInfoController.getSingleUserInfo);
exports.default = userRouter;
