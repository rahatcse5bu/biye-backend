"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const favourites_controller_1 = require("./favourites.controller");
const FavouritesRouter = express_1.default.Router();
FavouritesRouter.route("/")
    .get(favourites_controller_1.FavouritesController.getFavourites)
    .post(favourites_controller_1.FavouritesController.createFavourites);
FavouritesRouter.route("/:id")
    .get(favourites_controller_1.FavouritesController.getSingleFavourites)
    .put(favourites_controller_1.FavouritesController.updateFavourites)
    .delete(favourites_controller_1.FavouritesController.deleteFavourites);
exports.default = FavouritesRouter;
