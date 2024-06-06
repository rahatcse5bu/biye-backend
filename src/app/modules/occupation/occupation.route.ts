import express from "express";
import { OccupationController } from "./occupation.controller";
import { auth } from "../../middlewares/auth";
const OccupationRouter = express.Router();

OccupationRouter.route("/")
  .get(auth("admin"), OccupationController.getAllOccupationes)
  .put(auth("user", "admin"), OccupationController.updateOccupation)
  .post(auth("user", "admin"), OccupationController.createOccupation);

OccupationRouter.route("/token").get(
  auth("user", "admin"),
  OccupationController.getOccupationByToken
);
OccupationRouter.route("/:id")
  .get(auth("admin"), OccupationController.getOccupationById)
  .delete(auth("admin"), OccupationController.deleteOccupation);

export default OccupationRouter;
