// import express from "express";
// import { auth } from "../../middlewares/auth";
// import { UnFavoritesController } from "./unfavorites.controller";
// const UnFavoritesRouter = express.Router();

// UnFavoritesRouter.route("/")
// 	.get(auth("user", "admin"), UnFavoritesController.getUnFavoritesListByUserId)
// 	.post(auth("user", "admin"), UnFavoritesController.createUnFavorites);

// UnFavoritesRouter.route("/dislikes-who").get(
// 	auth("user", "admin"),
// 	UnFavoritesController.getUnFavouritesByWhoByUserId
// );

// UnFavoritesRouter.route("/user-data/:userId/:bioId").get(
// 	UnFavoritesController.getUnFavoritesByUserId
// );
// UnFavoritesRouter.route("/bio-data/:id")
// 	.get(UnFavoritesController.getUnFavoritesCountByBioId)
// 	.put(UnFavoritesController.updateUnFavorites)
// 	.delete(UnFavoritesController.deleteUnFavorites);

// export default UnFavoritesRouter;
