import express from "express";
import { FamilyStatusController } from "./family_status.controller";
const FamilyStatusRouter = express.Router();

FamilyStatusRouter.route("/")
  .get(FamilyStatusController.getFamilyStatus)
  .post(FamilyStatusController.createFamilyStatus);

FamilyStatusRouter.route("/:id")
  .get(FamilyStatusController.getSingleFamilyStatus)
  .put(FamilyStatusController.updateFamilyStatus)
  .delete(FamilyStatusController.deleteFamilyStatus);

export default FamilyStatusRouter;
