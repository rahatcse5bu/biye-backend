import express from "express";
import { UserInfoController } from "./user_info.controller";
const userRouter = express.Router();

userRouter
	.route("/")
	.get(UserInfoController.getUserInfo)
	.post(UserInfoController.createUserInfo)
userRouter.route("/:id").delete(UserInfoController.deleteUserInfo).put(UserInfoController.updateUserInfo).get(UserInfoController.getSinleUserInfo);

export default userRouter;
