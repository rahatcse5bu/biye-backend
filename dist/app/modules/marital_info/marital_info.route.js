"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const marital_info_controller_1 = require("./marital_info.controller");
const MaritalInfoRouter = express_1.default.Router();
MaritalInfoRouter.route("/")
    .get(marital_info_controller_1.MaritalInfoController.getMaritalInfo)
    .post(marital_info_controller_1.MaritalInfoController.createMaritalInfo);
MaritalInfoRouter.route("/:id")
    .get(marital_info_controller_1.MaritalInfoController.getSingleMaritalInfo)
    .put(marital_info_controller_1.MaritalInfoController.updateMaritalInfo)
    .delete(marital_info_controller_1.MaritalInfoController.deleteMaritalInfo);
exports.default = MaritalInfoRouter;
