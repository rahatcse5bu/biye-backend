"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middlewares/auth");
const bio_choice_data_controller_1 = require("./bio_choice_data.controller");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const bio_choice_data_validation_1 = require("./bio_choice_data.validation");
const BioChoiceDataRouter = express_1.default.Router();
BioChoiceDataRouter.route("/")
    .get((0, auth_1.auth)("admin"), bio_choice_data_controller_1.BioChoiceController.getAllBioChoices)
    .post((0, validateRequest_1.default)(bio_choice_data_validation_1.BioChoiceValidation.createBioChoice), (0, auth_1.auth)("user", "admin"), bio_choice_data_controller_1.BioChoiceController.createBioChoice)
    .put((0, validateRequest_1.default)(bio_choice_data_validation_1.BioChoiceValidation.updateBioChoice), (0, auth_1.auth)("user", "admin"), bio_choice_data_controller_1.BioChoiceController.updateBioChoice);
BioChoiceDataRouter.route("/token").get((0, auth_1.auth)("user", "admin"), bio_choice_data_controller_1.BioChoiceController.getBioChoiceByToken);
// BioChoiceDataRouter.route("/bio-data").put(
//   auth("user", "admin"),
// );
BioChoiceDataRouter.route("/first-step").get((0, auth_1.auth)("user", "admin"), bio_choice_data_controller_1.BioChoiceController.getBioChoiceDataOfFirstStep);
// BioChoiceDataRouter.route("/second-step").get(
//   auth("user", "admin"),
//   BioChoiceDataController.getBioChoiceDataOfSecondStep
// );
BioChoiceDataRouter.route("/bio-share").get((0, auth_1.auth)("user", "admin"), bio_choice_data_controller_1.BioChoiceController.getBioChoiceDataOfShare);
// BioChoiceDataRouter.route("/check-second-step/:id").get(
//   auth("user", "admin"),
//   BioChoiceDataController.checkBioChoiceDataOfSecondStep
// );
// BioChoiceDataRouter.route("/check-first-step/:id").get(
//   auth("user", "admin"),
//   BioChoiceDataController.checkBioChoiceDataOfFirstStep
// );
BioChoiceDataRouter.route("/statistics/:bio_user").get(bio_choice_data_controller_1.BioChoiceController.getBioChoiceStatisticsData);
// BioChoiceDataRouter.route("/:id")
//   .get(BioChoiceDataController.getSingleBioChoiceData)
//   .put(BioChoiceDataController.updateBioChoiceData)
//   .delete(BioChoiceDataController.deleteBioChoiceData);
exports.default = BioChoiceDataRouter;
