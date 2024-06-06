"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const marital_info_controller_1 = require("./marital_info.controller");
const auth_1 = require("../../middlewares/auth");
const MaritalInfoRouter = express_1.default.Router();
MaritalInfoRouter.route("/")
    .get((0, auth_1.auth)("admin"), marital_info_controller_1.MaritalInfoController.getAllMaritalInfos)
    .post((0, auth_1.auth)("user", "admin"), marital_info_controller_1.MaritalInfoController.createMaritalInfo)
    .put((0, auth_1.auth)("user", "admin"), marital_info_controller_1.MaritalInfoController.updateMaritalInfo);
MaritalInfoRouter.route("/token").get((0, auth_1.auth)("user", "admin"), marital_info_controller_1.MaritalInfoController.getMaritalInfoByToken);
MaritalInfoRouter.route("/:id")
    .get((0, auth_1.auth)("user", "admin"), marital_info_controller_1.MaritalInfoController.getMaritalInfoById)
    .delete((0, auth_1.auth)("user", "admin"), marital_info_controller_1.MaritalInfoController.deleteMaritalInfo);
exports.default = MaritalInfoRouter;
