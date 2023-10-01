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
    .get(marital_info_controller_1.MaritalInfoController.getMaritalInfo)
    .post((0, auth_1.auth)("user", "admin"), marital_info_controller_1.MaritalInfoController.createMaritalInfo)
    .put((0, auth_1.auth)("user", "admin"), marital_info_controller_1.MaritalInfoController.updateMaritalInfo);
MaritalInfoRouter.route("/:id/user-id").get(marital_info_controller_1.MaritalInfoController.getMaritalInfoByUserId);
MaritalInfoRouter.route("/:id")
    .get(marital_info_controller_1.MaritalInfoController.getSingleMaritalInfo)
    .delete(marital_info_controller_1.MaritalInfoController.deleteMaritalInfo);
exports.default = MaritalInfoRouter;
