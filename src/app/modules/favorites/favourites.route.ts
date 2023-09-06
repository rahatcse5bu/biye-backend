import express from "express";
import { FavouritesController } from "./favourites.controller";
const FavouritesRouter = express.Router();

FavouritesRouter.route("/")
  .get(FavouritesController.getFavourites)
  .post(FavouritesController.createFavourites);

FavouritesRouter.route("/:id")
  .get(FavouritesController.getSingleFavourites)
  .put(FavouritesController.updateFavourites)
  .delete(FavouritesController.deleteFavourites);

export default FavouritesRouter;
