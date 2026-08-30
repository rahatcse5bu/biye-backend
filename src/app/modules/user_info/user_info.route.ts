import express from "express";
import { auth } from "../../middlewares/auth";
import { UserInfoController } from "./user_info.controller";
const userRouter = express.Router();

userRouter.route("/google-auth").post(UserInfoController.googleAuth);
userRouter.route("/register").post(UserInfoController.register);
userRouter.route("/login").post(UserInfoController.login);
userRouter
  .route("/change-password")
  .patch(auth("admin", "user"), UserInfoController.changePassword);
userRouter
  .route("/me")
  .get(auth("admin", "user"), UserInfoController.getMe);

userRouter.route("/").post(UserInfoController.createUserInfo);
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
userRouter.route("/email/:email").get(UserInfoController.getUserInfoByEmail);
// userRouter.route("/:id").get(UserInfoController.getSingleUserInfo);

export default userRouter;
