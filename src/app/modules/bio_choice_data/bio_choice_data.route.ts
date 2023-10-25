import express from "express";
import { BioChoiceDataController } from "./bio_choice_data.controller";
import { auth } from "../../middlewares/auth";
const BioChoiceDataRouter = express.Router();

BioChoiceDataRouter.route("/")
	.get(BioChoiceDataController.getBioChoiceData)
	.post(auth("user", "admin"), BioChoiceDataController.createBioChoiceData);
BioChoiceDataRouter.route("/statistics/:id").get(
	BioChoiceDataController.getBioChoiceStatisticsData
);
BioChoiceDataRouter.route("/:id")
	.get(BioChoiceDataController.getSingleBioChoiceData)
	.put(BioChoiceDataController.updateBioChoiceData)
	.delete(BioChoiceDataController.deleteBioChoiceData);

export default BioChoiceDataRouter;
