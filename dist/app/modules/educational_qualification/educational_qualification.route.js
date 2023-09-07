"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const educational_qualification_controller_1 = require("./educational_qualification.controller");
const EducationalQualificationRouter = express_1.default.Router();
EducationalQualificationRouter.route("/")
    .get(educational_qualification_controller_1.EducationalQualificationController.getEducationalQualification)
    .post(educational_qualification_controller_1.EducationalQualificationController.createEducationalQualification);
EducationalQualificationRouter.route("/:id")
    .get(educational_qualification_controller_1.EducationalQualificationController.getSingleEducationalQualification)
    .put(educational_qualification_controller_1.EducationalQualificationController.updateEducationalQualification)
    .delete(educational_qualification_controller_1.EducationalQualificationController.deleteEducationalQualification);
exports.default = EducationalQualificationRouter;
