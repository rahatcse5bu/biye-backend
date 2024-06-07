import express from "express";
import { auth } from "../../middlewares/auth";
import { FavoriteController } from "./favourites.controller";
const FavouritesRouter = express.Router();

FavouritesRouter.route("/").post(
  auth("user", "admin"),
  FavoriteController.createFavorite
);
FavouritesRouter.route("/check/:id").get(
  auth("user", "admin"),
  FavoriteController.checkLikes
);

// FavouritesRouter.route("/likes-who").get(
// 	auth("user", "admin"),
// 	FavoriteController.getFavouritesByWhoByUserId
// );

// FavouritesRouter.route("/user-data/:userId/:bioId").get(
// 	FavoriteController.getFavouritesByUserId
// );
// FavouritesRouter.route("/bio-data/:id")
// 	.get(FavoriteController.getFavouritesCountByBioId)
// 	.put(FavoriteController.updateFavourites)
// 	.delete(FavoriteController.deleteFavourites);

export default FavouritesRouter;
