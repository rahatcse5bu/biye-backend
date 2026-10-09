import express from "express";
import { auth } from "../../middlewares/auth";
import { BioChoiceController } from "./bio_choice_data.controller";
import validateRequest from "../../middlewares/validateRequest";
import { BioChoiceValidation } from "./bio_choice_data.validation";
import { rateLimit } from "../../../shared/rateLimit";
const BioChoiceDataRouter = express.Router();

BioChoiceDataRouter.route("/")
  .get(auth("admin"), BioChoiceController.getAllBioChoices)
  .post(
    validateRequest(BioChoiceValidation.createBioChoice),
    auth("user", "admin"),
    BioChoiceController.createBioChoice
  )
  .put(
    validateRequest(BioChoiceValidation.updateBioChoice),
    auth("user", "admin"),
    BioChoiceController.updateBioChoice
  );
BioChoiceDataRouter.route("/token").get(
  auth("user", "admin"),
  BioChoiceController.getBioChoiceByToken
);
BioChoiceDataRouter.route("/admin/all").get(
  auth("admin"),
  BioChoiceController.getBioChoicesByAdmin
);

// BioChoiceDataRouter.route("/bio-data").put(
//   auth("user", "admin"),

// );
BioChoiceDataRouter.route("/first-step").get(
  auth("user", "admin"),
  BioChoiceController.getBioChoiceDataOfFirstStep
);
BioChoiceDataRouter.route("/second-step").get(
  auth("user", "admin"),
  BioChoiceController.getBioChoiceDataOfSecondStep
);
BioChoiceDataRouter.route("/bio-share").get(
  auth("user", "admin"),
  BioChoiceController.getBioChoiceDataOfShare
);

BioChoiceDataRouter.route("/check-second-step/:id").get(
  auth("user", "admin"),
  BioChoiceController.checkBioChoiceDataOfSecondStep
);
BioChoiceDataRouter.route("/check-first-step/:id").get(
  auth("user", "admin"),
  BioChoiceController.checkBioChoiceDataOfFirstStep
);

BioChoiceDataRouter.route("/remind/:id").post(
  rateLimit({ name: "proposal-reminder", windowMs: 60 * 60 * 1000, max: 20 }),
  auth("user", "admin"),
  BioChoiceController.sendReminderEmail
);
BioChoiceDataRouter.route("/reminder-settings")
  .get(auth("admin"), BioChoiceController.getReminderSettings)
  .patch(auth("admin"), BioChoiceController.updateReminderSettings);

BioChoiceDataRouter.route("/statistics/:bio_user").get(
  BioChoiceController.getBioChoiceStatisticsData
);
// BioChoiceDataRouter.route("/:id")
//   .get(BioChoiceDataController.getSingleBioChoiceData)
//   .put(BioChoiceDataController.updateBioChoiceData)
//   .delete(BioChoiceDataController.deleteBioChoiceData);

export default BioChoiceDataRouter;
