import express from "express";
import { UserTokenControllers, verifyJWT } from "./user_token.controller";
const userTokenRouter = express.Router();

userTokenRouter.route("/verify-token").get(verifyJWT);
userTokenRouter
	.route("/create-token/:tokenId")
	.get(UserTokenControllers.getUserToken);

export default userTokenRouter;
