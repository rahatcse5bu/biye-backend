import express from "express";
import { auth } from "../../middlewares/auth";
import { EducationalQualificationController } from "./educational_qualification.controller";
const EducationalQualificationRouter = express.Router();

EducationalQualificationRouter.route("/")
  .get(auth("admin"), EducationalQualificationController.getAllEducationalQualifications)
  .post(
    auth("user", "admin"),
    EducationalQualificationController.createEducationalQualification
  )
  .put(
    auth("user", "admin"),
    EducationalQualificationController.updateEducationalQualification
  );

EducationalQualificationRouter.route("/token").get(
  auth("user", "admin"),
  EducationalQualificationController.getEducationalQualificationByToken
);
EducationalQualificationRouter.route("/:id")
  .get(auth("admin"), EducationalQualificationController.getSingleEducationalQualification)

  .delete(auth("admin"), EducationalQualificationController.deleteEducationalQualification);

export default EducationalQualificationRouter;
