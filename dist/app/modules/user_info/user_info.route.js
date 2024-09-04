"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const verifyIdToken_1 = require("./../../middlewares/verifyIdToken");
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middlewares/auth");
const user_info_controller_1 = require("./user_info.controller");
const userRouter = express_1.default.Router();
userRouter.route("/").post(user_info_controller_1.UserInfoController.createUserInfo);
userRouter
    .route("/")
    .put((0, auth_1.auth)("user", "admin"), user_info_controller_1.UserInfoController.updateUserInfo);
userRouter
    .route("/update-status")
    .put((0, auth_1.auth)("user", "admin"), user_info_controller_1.UserInfoController.updateUserStatusByUser);
userRouter
    .route("/admin/:bioId")
    .put((0, auth_1.auth)("admin"), user_info_controller_1.UserInfoController.updateUserInfoByAdmin);
userRouter
    .route("/all-users-id")
    .get((0, auth_1.auth)("admin", "user"), user_info_controller_1.UserInfoController.getAllUsersInfoId);
userRouter
    .route("/verify-token")
    .get((0, auth_1.auth)("admin", "user"), user_info_controller_1.UserInfoController.verifyTokenByUser);
userRouter.route("/status/:id").get(user_info_controller_1.UserInfoController.getUserStatus);
userRouter
    .route("/user-email/:email")
    .post((0, auth_1.auth)("admin"), user_info_controller_1.UserInfoController.sendUserEmail);
userRouter.route("/email/:email").get(user_info_controller_1.UserInfoController.getUserInfoByEmail);
userRouter
    .route("/create-login-user")
    .post(verifyIdToken_1.verifyIdToken, user_info_controller_1.UserInfoController.createUserForGoogleSignIn);
// userRouter.route("/:id").get(UserInfoController.getSingleUserInfo);
exports.default = userRouter;
