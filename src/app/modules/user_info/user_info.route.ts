import express from "express";
import { UserInfoController } from "./user_info.controller";
const userRouter = express.Router();

userRouter
	.route("/")
	.get(UserInfoController.getUserInfo)
	.post(UserInfoController.createUserInfo);

export default userRouter;
