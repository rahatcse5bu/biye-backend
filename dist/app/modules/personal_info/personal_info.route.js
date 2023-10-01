"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const personal_info_controller_1 = require("./personal_info.controller"); // Replace with the actual path
const auth_1 = require("../../middlewares/auth");
const personalInfoRouter = express_1.default.Router();
personalInfoRouter
    .route("/")
    .get(personal_info_controller_1.PersonalInfoController.getPersonalInfo)
    .post((0, auth_1.auth)("user", "admin"), personal_info_controller_1.PersonalInfoController.createPersonalInfo)
    .put((0, auth_1.auth)("user", "admin"), personal_info_controller_1.PersonalInfoController.updatePersonalInfo);
personalInfoRouter
    .route("/:id/user-id")
    .get(personal_info_controller_1.PersonalInfoController.getPersonalInfoByUserId);
personalInfoRouter
    .route("/:id")
    .get(personal_info_controller_1.PersonalInfoController.getSinglePersonalInfo)
    .delete(personal_info_controller_1.PersonalInfoController.deletePersonalInfo);
exports.default = personalInfoRouter;
