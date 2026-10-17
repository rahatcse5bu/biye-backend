"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middlewares/auth");
const user_info_controller_1 = require("./user_info.controller");
const rateLimit_1 = require("../../../shared/rateLimit");
const MINUTE = 60 * 1000;
const loginLimit = (0, rateLimit_1.rateLimit)({ name: "login", windowMs: 15 * MINUTE, max: 10, message: "Too many login attempts. Please try again in 15 minutes." });
const signupLimit = (0, rateLimit_1.rateLimit)({ name: "signup", windowMs: 60 * MINUTE, max: 10 });
const passwordResetLimit = (0, rateLimit_1.rateLimit)({ name: "password-reset", windowMs: 60 * MINUTE, max: 5 });
const userRouter = express_1.default.Router();
userRouter.route("/google-auth").post(loginLimit, user_info_controller_1.UserInfoController.googleAuth);
userRouter.route("/register").post(signupLimit, user_info_controller_1.UserInfoController.register);
userRouter.route("/login").post(loginLimit, user_info_controller_1.UserInfoController.login);
userRouter.route("/forgot-password").post(passwordResetLimit, user_info_controller_1.UserInfoController.forgotPassword);
userRouter.route("/reset-password").post(passwordResetLimit, user_info_controller_1.UserInfoController.resetPassword);
userRouter
    .route("/change-password")
    .patch((0, auth_1.auth)("admin", "user"), user_info_controller_1.UserInfoController.changePassword);
userRouter
    .route("/me")
    .get((0, auth_1.auth)("admin", "user"), user_info_controller_1.UserInfoController.getMe);
userRouter
    .route("/me/preferences")
    .patch((0, auth_1.auth)("admin", "user"), user_info_controller_1.UserInfoController.updateMyPreferences);
// TODO: the old open "create user" route accepted any body (including user_role: "admin"); signup uses /register.
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
userRouter
    .route("/email/:email")
    .get((0, auth_1.auth)("user", "admin"), user_info_controller_1.UserInfoController.getUserInfoByEmail);
// userRouter.route("/:id").get(UserInfoController.getSingleUserInfo);
exports.default = userRouter;
