import express from "express";
import { OccupationController } from "./occupation.controller";
import { auth } from "../../middlewares/auth";
const OccupationRouter = express.Router();

OccupationRouter.route("/")
	.get(OccupationController.getOccupation)
	.put(auth("user", "admin"), OccupationController.updateOccupation)
	.post(auth("user", "admin"), OccupationController.createOccupation);

OccupationRouter.route("/:id/user-id").get(
	OccupationController.getOccupationByUserId
);
OccupationRouter.route("/:id")
	.get(OccupationController.getSingleOccupation)
	.delete(OccupationController.deleteOccupation);

export default OccupationRouter;
