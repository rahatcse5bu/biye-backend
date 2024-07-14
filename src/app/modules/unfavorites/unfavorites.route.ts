import express from "express";
import { auth } from "../../middlewares/auth";
import { UnFavoriteController } from "./unfavorites.controller";
const UnFavouritesRouter = express.Router();

UnFavouritesRouter.route("/")
  .post(auth("user", "admin"), UnFavoriteController.createUnFavorite)
  .get(auth("user", "admin"), UnFavoriteController.getMyUnFavouritesList);
UnFavouritesRouter.route("/check/:id").get(
  auth("user", "admin"),
  UnFavoriteController.checkDisLikes
);

UnFavouritesRouter.route("/bio-user/:bio_user").get(
  auth("user", "admin"),
  UnFavoriteController.getUnFavouritesListByUser
);

export default UnFavouritesRouter;
