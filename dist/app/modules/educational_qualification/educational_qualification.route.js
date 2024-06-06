"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middlewares/auth");
const educational_qualification_controller_1 = require("./educational_qualification.controller");
const EducationalQualificationRouter = express_1.default.Router();
EducationalQualificationRouter.route("/")
    .get(educational_qualification_controller_1.EducationalQualificationController.getAllEducationalQualifications)
    .post((0, auth_1.auth)("user", "admin"), educational_qualification_controller_1.EducationalQualificationController.createEducationalQualification)
    .put((0, auth_1.auth)("user", "admin"), educational_qualification_controller_1.EducationalQualificationController.updateEducationalQualification);
EducationalQualificationRouter.route("/token").get((0, auth_1.auth)("user", "admin"), educational_qualification_controller_1.EducationalQualificationController.getEducationalQualificationByToken);
EducationalQualificationRouter.route("/:id")
    .get(educational_qualification_controller_1.EducationalQualificationController.getSingleEducationalQualification)
    .delete(educational_qualification_controller_1.EducationalQualificationController.deleteEducationalQualification);
exports.default = EducationalQualificationRouter;
