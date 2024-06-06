"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const general_info_controller_1 = require("./general_info.controller");
const auth_1 = require("../../middlewares/auth");
const GeneralInfoRouter = express_1.default.Router();
GeneralInfoRouter.route("/")
    .get(general_info_controller_1.GeneralInfoController.getGeneralInfo)
    .post((0, auth_1.auth)("user", "admin"), general_info_controller_1.GeneralInfoController.createGeneralInfo)
    .put((0, auth_1.auth)("user", "admin"), general_info_controller_1.GeneralInfoController.updateGeneralInfo);
GeneralInfoRouter.route("/token").get((0, auth_1.auth)("user", "admin"), general_info_controller_1.GeneralInfoController.getGeneralInfoByToken);
GeneralInfoRouter.route("/:id/user-id").get(general_info_controller_1.GeneralInfoController.getGeneralInfoByUserId);
GeneralInfoRouter.route("/:id")
    .get((0, auth_1.auth)("admin"), general_info_controller_1.GeneralInfoController.getSingleGeneralInfo)
    .delete((0, auth_1.auth)("admin"), general_info_controller_1.GeneralInfoController.deleteGeneralInfo);
exports.default = GeneralInfoRouter;
