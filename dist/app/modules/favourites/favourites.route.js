"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const favourites_controller_1 = require("./favourites.controller");
const auth_1 = require("../../middlewares/auth");
const FavouritesRouter = express_1.default.Router();
FavouritesRouter.route("/")
    .get((0, auth_1.auth)("user", "admin"), favourites_controller_1.FavouritesController.getFavouritesListByUserId)
    .post((0, auth_1.auth)("user", "admin"), favourites_controller_1.FavouritesController.createFavourites);
FavouritesRouter.route("/user-data/:userId/:bioId").get(favourites_controller_1.FavouritesController.getFavouritesByUserId);
FavouritesRouter.route("/bio-data/:id")
    .get(favourites_controller_1.FavouritesController.getFavouritesCountByBioId)
    .put(favourites_controller_1.FavouritesController.updateFavourites)
    .delete(favourites_controller_1.FavouritesController.deleteFavourites);
exports.default = FavouritesRouter;
