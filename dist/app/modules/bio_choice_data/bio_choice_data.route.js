"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bio_choice_data_controller_1 = require("./bio_choice_data.controller");
const BioChoiceDataRouter = express_1.default.Router();
BioChoiceDataRouter.route("/")
    .get(bio_choice_data_controller_1.BioChoiceDataController.getBioChoiceData)
    .post(bio_choice_data_controller_1.BioChoiceDataController.createBioChoiceData);
BioChoiceDataRouter.route("/statistics/:id").get(bio_choice_data_controller_1.BioChoiceDataController.getBioChoiceStatisticsData);
BioChoiceDataRouter.route("/:id")
    .get(bio_choice_data_controller_1.BioChoiceDataController.getSingleBioChoiceData)
    .put(bio_choice_data_controller_1.BioChoiceDataController.updateBioChoiceData)
    .delete(bio_choice_data_controller_1.BioChoiceDataController.deleteBioChoiceData);
exports.default = BioChoiceDataRouter;
