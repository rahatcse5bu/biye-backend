"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const occupation_controller_1 = require("./occupation.controller");
const auth_1 = require("../../middlewares/auth");
const OccupationRouter = express_1.default.Router();
OccupationRouter.route("/")
    .get((0, auth_1.auth)("admin"), occupation_controller_1.OccupationController.getAllOccupationes)
    .put((0, auth_1.auth)("user", "admin"), occupation_controller_1.OccupationController.updateOccupation)
    .post((0, auth_1.auth)("user", "admin"), occupation_controller_1.OccupationController.createOccupation);
OccupationRouter.route("/token").get((0, auth_1.auth)("user", "admin"), occupation_controller_1.OccupationController.getOccupationByToken);
OccupationRouter.route("/:id")
    .get((0, auth_1.auth)("admin"), occupation_controller_1.OccupationController.getOccupationById)
    .delete((0, auth_1.auth)("admin"), occupation_controller_1.OccupationController.deleteOccupation);
exports.default = OccupationRouter;
