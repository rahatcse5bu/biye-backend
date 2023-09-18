import express from "express";
import { UserTokenControllers } from "./user_token.controller";
const userTokenRouter = express.Router();

userTokenRouter
  .route("/create-token/:userToken")
  .post(UserTokenControllers.getUserToken);

export default userTokenRouter;
