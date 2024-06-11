"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middlewares/auth");
const favourites_controller_1 = require("./favourites.controller");
const FavouritesRouter = express_1.default.Router();
FavouritesRouter.route("/")
    .post((0, auth_1.auth)("user", "admin"), favourites_controller_1.FavoriteController.createFavorite)
    .get((0, auth_1.auth)("user", "admin"), favourites_controller_1.FavoriteController.getMyFavouritesList);
FavouritesRouter.route("/check/:id").get((0, auth_1.auth)("user", "admin"), favourites_controller_1.FavoriteController.checkLikes);
FavouritesRouter.route("/bio-user/:bio_user").get((0, auth_1.auth)("user", "admin"), favourites_controller_1.FavoriteController.getFavouritesListByUser);
// FavouritesRouter.route("/user-data/:userId/:bioId").get(
// 	FavoriteController.getFavouritesByUserId
// );
// FavouritesRouter.route("/bio-data/:id")
// 	.get(FavoriteController.getFavouritesCountByBioId)
// 	.put(FavoriteController.updateFavourites)
// 	.delete(FavoriteController.deleteFavourites);
exports.default = FavouritesRouter;
