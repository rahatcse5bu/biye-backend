import express from "express";
import { BioChoiceDataController } from "./bio_choice_data.controller";
const BioChoiceDataRouter = express.Router();

BioChoiceDataRouter.route("/")
  .get(BioChoiceDataController.getBioChoiceData)
  .post(BioChoiceDataController.createBioChoiceData);

BioChoiceDataRouter.route("/:id")
  .get(BioChoiceDataController.getSingleBioChoiceData)
  .put(BioChoiceDataController.updateBioChoiceData)
  .delete(BioChoiceDataController.deleteBioChoiceData);

export default BioChoiceDataRouter;
