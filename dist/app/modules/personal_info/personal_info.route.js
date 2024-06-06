"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middlewares/auth");
const personal_info_controller_1 = require("./personal_info.controller");
const personalInfoRouter = express_1.default.Router();
personalInfoRouter
    .route("/")
    .get(personal_info_controller_1.PersonalInfoController.getAllPersonalInfoes)
    .post((0, auth_1.auth)("user", "admin"), personal_info_controller_1.PersonalInfoController.createPersonalInfo)
    .put((0, auth_1.auth)("user", "admin"), personal_info_controller_1.PersonalInfoController.updatePersonalInfo);
personalInfoRouter
    .route("/token")
    .get((0, auth_1.auth)("user", "admin"), personal_info_controller_1.PersonalInfoController.getPersonalInfoByToken);
personalInfoRouter
    .route("/:id")
    .get(personal_info_controller_1.PersonalInfoController.getPersonalInfoById)
    .delete(personal_info_controller_1.PersonalInfoController.deletePersonalInfo);
exports.default = personalInfoRouter;
