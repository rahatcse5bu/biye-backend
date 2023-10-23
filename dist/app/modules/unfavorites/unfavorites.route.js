"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middlewares/auth");
const unfavorites_controller_1 = require("./unfavorites.controller");
const UnFavoritesRouter = express_1.default.Router();
UnFavoritesRouter.route("/")
    .get((0, auth_1.auth)("user", "admin"), unfavorites_controller_1.UnFavoritesController.getUnFavoritesListByUserId)
    .post((0, auth_1.auth)("user", "admin"), unfavorites_controller_1.UnFavoritesController.createUnFavorites);
UnFavoritesRouter.route("/user-data/:userId/:bioId").get(unfavorites_controller_1.UnFavoritesController.getUnFavoritesByUserId);
UnFavoritesRouter.route("/bio-data/:id")
    .get(unfavorites_controller_1.UnFavoritesController.getUnFavoritesCountByBioId)
    .put(unfavorites_controller_1.UnFavoritesController.updateUnFavorites)
    .delete(unfavorites_controller_1.UnFavoritesController.deleteUnFavorites);
exports.default = UnFavoritesRouter;
