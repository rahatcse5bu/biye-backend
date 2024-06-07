"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middlewares/auth");
const unfavorites_controller_1 = require("./unfavorites.controller");
const UnFavouritesRouter = express_1.default.Router();
UnFavouritesRouter.route("/").post((0, auth_1.auth)("user", "admin"), unfavorites_controller_1.UnFavoriteController.createUnFavorite);
UnFavouritesRouter.route("/check/:id").get((0, auth_1.auth)("user", "admin"), unfavorites_controller_1.UnFavoriteController.checkDisLikes);
exports.default = UnFavouritesRouter;
