import express from "express";
import { auth } from "../../middlewares/auth";
import { UnFavoriteController } from "./unfavorites.controller";
const UnFavouritesRouter = express.Router();

UnFavouritesRouter.route("/").post(
  auth("user", "admin"),
  UnFavoriteController.createUnFavorite
);
UnFavouritesRouter.route("/check/:id").get(
  auth("user", "admin"),
  UnFavoriteController.checkDisLikes
);

export default UnFavouritesRouter;
