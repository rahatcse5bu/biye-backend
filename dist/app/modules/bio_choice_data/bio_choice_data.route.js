"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bio_choice_data_controller_1 = require("./bio_choice_data.controller");
const auth_1 = require("../../middlewares/auth");
const BioChoiceDataRouter = express_1.default.Router();
BioChoiceDataRouter.route("/")
    .get(bio_choice_data_controller_1.BioChoiceDataController.getBioChoiceData)
    .post((0, auth_1.auth)("user", "admin"), bio_choice_data_controller_1.BioChoiceDataController.createBioChoiceData);
BioChoiceDataRouter.route("/first-step").get((0, auth_1.auth)("user", "admin"), bio_choice_data_controller_1.BioChoiceDataController.getBioChoiceDataOfFirstStep);
BioChoiceDataRouter.route("/second-step").get((0, auth_1.auth)("user", "admin"), bio_choice_data_controller_1.BioChoiceDataController.getBioChoiceDataOfSecondStep);
BioChoiceDataRouter.route("/check-second-step/:id").get((0, auth_1.auth)("user", "admin"), bio_choice_data_controller_1.BioChoiceDataController.checkBioChoiceDataOfSecondStep);
BioChoiceDataRouter.route("/check-first-step/:id").get((0, auth_1.auth)("user", "admin"), bio_choice_data_controller_1.BioChoiceDataController.checkBioChoiceDataOfFirstStep);
BioChoiceDataRouter.route("/statistics/:id").get(bio_choice_data_controller_1.BioChoiceDataController.getBioChoiceStatisticsData);
BioChoiceDataRouter.route("/:id")
    .get(bio_choice_data_controller_1.BioChoiceDataController.getSingleBioChoiceData)
    .put(bio_choice_data_controller_1.BioChoiceDataController.updateBioChoiceData)
    .delete(bio_choice_data_controller_1.BioChoiceDataController.deleteBioChoiceData);
exports.default = BioChoiceDataRouter;
