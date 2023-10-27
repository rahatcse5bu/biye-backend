import express from "express";
import { UserTokenControllers } from "./user_token.controller";
import { auth } from "../../middlewares/auth";
const userTokenRouter = express.Router();

userTokenRouter
	.route("/verify-token")
	.get(auth("user", "admin"), UserTokenControllers.verifyJWT);
userTokenRouter
	.route("/create-token/:tokenId")
	.get(UserTokenControllers.getUserToken);

export default userTokenRouter;
