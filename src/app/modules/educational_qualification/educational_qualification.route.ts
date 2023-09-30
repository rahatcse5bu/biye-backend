import express from "express";
import { EducationalQualificationController } from "./educational_qualification.controller";
const EducationalQualificationRouter = express.Router();

EducationalQualificationRouter.route("/")
  .get(EducationalQualificationController.getEducationalQualification)
  .post(EducationalQualificationController.createEducationalQualification);

EducationalQualificationRouter.route("/:id")
  .get(EducationalQualificationController.getSingleEducationalQualification)
  .put(EducationalQualificationController.updateEducationalQualification)
  .delete(EducationalQualificationController.deleteEducationalQualification);

export default EducationalQualificationRouter;
