import express from "express";
import { FavouritesController } from "./favourites.controller";
import { auth } from "../../middlewares/auth";
const FavouritesRouter = express.Router();

FavouritesRouter.route("/")
	.get(auth("user", "admin"), FavouritesController.getFavouritesListByUserId)
	.post(auth("user", "admin"), FavouritesController.createFavourites);

FavouritesRouter.route("/user-data/:userId/:bioId").get(
	FavouritesController.getFavouritesByUserId
);
FavouritesRouter.route("/bio-data/:id")
	.get(FavouritesController.getFavouritesCountByBioId)
	.put(FavouritesController.updateFavourites)
	.delete(FavouritesController.deleteFavourites);

export default FavouritesRouter;
