import express from "express";
import { FamilyStatusController } from "./family_status.controller";
import { auth } from "../../middlewares/auth";
const FamilyStatusRouter = express.Router();

FamilyStatusRouter.route("/")
	.get(FamilyStatusController.getFamilyStatus)
	.post(auth("user", "admin"), FamilyStatusController.createFamilyStatus)
	.put(auth("user", "admin"), FamilyStatusController.updateFamilyStatus);
FamilyStatusRouter.route("/:id/user-id").get(
	FamilyStatusController.getFamilyStatusByUserId
);

FamilyStatusRouter.route("/:id")
	.get(FamilyStatusController.getSingleFamilyStatus)
	.delete(FamilyStatusController.deleteFamilyStatus);

export default FamilyStatusRouter;
