import express from "express";
import { FamilyStatusController } from "./family_status.controller";
import { auth } from "../../middlewares/auth";
const FamilyStatusRouter = express.Router();

FamilyStatusRouter.route("/")
  .get(auth("admin"), FamilyStatusController.getFamilyStatus)
  .post(auth("user", "admin"), FamilyStatusController.createFamilyStatus)
  .put(auth("user", "admin"), FamilyStatusController.updateFamilyStatus);
FamilyStatusRouter.route("/token").get(
  auth("user", "admin"),
  FamilyStatusController.getFamilyStatusByToken
);

FamilyStatusRouter.route("/:id")
  .get(auth("admin"), FamilyStatusController.getSingleFamilyStatus)
  .delete(auth("admin"), FamilyStatusController.deleteFamilyStatus);

export default FamilyStatusRouter;
