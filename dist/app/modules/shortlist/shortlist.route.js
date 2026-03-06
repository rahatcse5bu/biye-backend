"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middlewares/auth");
const shortlist_controller_1 = require("./shortlist.controller");
const ShortlistRouter = express_1.default.Router();
// Toggle shortlist + Get my shortlist
ShortlistRouter.route("/")
    .post((0, auth_1.auth)("user", "admin"), shortlist_controller_1.ShortlistController.toggleShortlist)
    .get((0, auth_1.auth)("user", "admin"), shortlist_controller_1.ShortlistController.getMyShortlist);
// Check if a bio is shortlisted
ShortlistRouter.route("/check/:id").get((0, auth_1.auth)("user", "admin"), shortlist_controller_1.ShortlistController.checkShortlist);
// Get who shortlisted my biodata
ShortlistRouter.route("/who-shortlisted-me").get((0, auth_1.auth)("user", "admin"), shortlist_controller_1.ShortlistController.getWhoShortlistedMe);
exports.default = ShortlistRouter;
