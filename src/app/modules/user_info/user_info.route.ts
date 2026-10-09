import express from "express";
import { auth } from "../../middlewares/auth";
import { UserInfoController } from "./user_info.controller";
import { rateLimit } from "../../../shared/rateLimit";

const MINUTE = 60 * 1000;
const loginLimit = rateLimit({ name: "login", windowMs: 15 * MINUTE, max: 10, message: "Too many login attempts. Please try again in 15 minutes." });
const signupLimit = rateLimit({ name: "signup", windowMs: 60 * MINUTE, max: 10 });
const passwordResetLimit = rateLimit({ name: "password-reset", windowMs: 60 * MINUTE, max: 5 });
const userRouter = express.Router();

userRouter.route("/google-auth").post(loginLimit, UserInfoController.googleAuth);
userRouter.route("/register").post(signupLimit, UserInfoController.register);
userRouter.route("/login").post(loginLimit, UserInfoController.login);
userRouter.route("/forgot-password").post(passwordResetLimit, UserInfoController.forgotPassword);
userRouter.route("/reset-password").post(passwordResetLimit, UserInfoController.resetPassword);
userRouter
  .route("/change-password")
  .patch(auth("admin", "user"), UserInfoController.changePassword);
userRouter
  .route("/me")
  .get(auth("admin", "user"), UserInfoController.getMe);
userRouter
  .route("/me/preferences")
  .patch(auth("admin", "user"), UserInfoController.updateMyPreferences);

// TODO: the old open "create user" route accepted any body (including user_role: "admin"); signup uses /register.
userRouter
  .route("/")
  .put(auth("user", "admin"), UserInfoController.updateUserInfo);

userRouter
  .route("/update-status")
  .put(auth("user", "admin"), UserInfoController.updateUserStatusByUser);
userRouter
  .route("/admin/:bioId")
  .put(auth("admin"), UserInfoController.updateUserInfoByAdmin);
userRouter
  .route("/all-users-id")
  .get(auth("admin", "user"), UserInfoController.getAllUsersInfoId);
userRouter
  .route("/verify-token")
  .get(auth("admin", "user"), UserInfoController.verifyTokenByUser);
userRouter.route("/status/:id").get(UserInfoController.getUserStatus);
userRouter
  .route("/user-email/:email")
  .post(auth("admin"), UserInfoController.sendUserEmail);
userRouter
  .route("/email/:email")
  .get(auth("user", "admin"), UserInfoController.getUserInfoByEmail);
// userRouter.route("/:id").get(UserInfoController.getSingleUserInfo);

export default userRouter;
