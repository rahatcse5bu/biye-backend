import express from "express";
import { auth } from "../../middlewares/auth";
import { UserInfoController } from "./user_info.controller";
const userRouter = express.Router();

userRouter.route("/").post(UserInfoController.createUserInfo);
userRouter
  .route("/")
  .put(auth("user", "admin"), UserInfoController.updateUserInfo);

userRouter.route("/status/:id").get(UserInfoController.getUserStatus);
userRouter.route("/email/:email").get(UserInfoController.getUserInfoByEmail);
userRouter
  .route("/create-login-user")
  .post(UserInfoController.createUserForGoogleSignIn);
// userRouter.route("/:id").get(UserInfoController.getSingleUserInfo);

export default userRouter;
