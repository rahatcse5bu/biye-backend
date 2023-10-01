"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const family_status_controller_1 = require("./family_status.controller");
const auth_1 = require("../../middlewares/auth");
const FamilyStatusRouter = express_1.default.Router();
FamilyStatusRouter.route("/")
    .get(family_status_controller_1.FamilyStatusController.getFamilyStatus)
    .post((0, auth_1.auth)("user", "admin"), family_status_controller_1.FamilyStatusController.createFamilyStatus)
    .put((0, auth_1.auth)("user", "admin"), family_status_controller_1.FamilyStatusController.updateFamilyStatus);
FamilyStatusRouter.route("/:id/user-id").get(family_status_controller_1.FamilyStatusController.getFamilyStatusByUserId);
FamilyStatusRouter.route("/:id")
    .get(family_status_controller_1.FamilyStatusController.getSingleFamilyStatus)
    .delete(family_status_controller_1.FamilyStatusController.deleteFamilyStatus);
exports.default = FamilyStatusRouter;
