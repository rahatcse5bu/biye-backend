"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const expected_lifepartner_controller_1 = require("./expected_lifepartner.controller");
const ExpectedLifePartnerRouter = express_1.default.Router();
ExpectedLifePartnerRouter.route("/")
    .get(expected_lifepartner_controller_1.ExpectedLifePartnerController.getExpectedLifePartner)
    .post(expected_lifepartner_controller_1.ExpectedLifePartnerController.createExpectedLifePartner);
ExpectedLifePartnerRouter.route("/:id")
    .get(expected_lifepartner_controller_1.ExpectedLifePartnerController.getSingleExpectedLifePartner)
    .put(expected_lifepartner_controller_1.ExpectedLifePartnerController.updateExpectedLifePartner)
    .delete(expected_lifepartner_controller_1.ExpectedLifePartnerController.deleteExpectedLifePartner);
exports.default = ExpectedLifePartnerRouter;
