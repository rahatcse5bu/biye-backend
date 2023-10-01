import express from "express";
import { EducationalQualificationController } from "./educational_qualification.controller";
import { auth } from "../../middlewares/auth";
const EducationalQualificationRouter = express.Router();

EducationalQualificationRouter.route("/")
	.get(EducationalQualificationController.getEducationalQualification)
	.post(
		auth("user", "admin"),
		EducationalQualificationController.createEducationalQualification
	)
	.put(
		auth("user", "admin"),
		EducationalQualificationController.updateEducationalQualification
	);

EducationalQualificationRouter.route("/:id/user-id").get(
	EducationalQualificationController.getEducationalQualificationByUserId
);
EducationalQualificationRouter.route("/:id")
	.get(EducationalQualificationController.getSingleEducationalQualification)

	.delete(EducationalQualificationController.deleteEducationalQualification);

export default EducationalQualificationRouter;
