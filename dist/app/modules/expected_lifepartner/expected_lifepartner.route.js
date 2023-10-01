"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const expected_lifepartner_controller_1 = require("./expected_lifepartner.controller");
const auth_1 = require("../../middlewares/auth");
const ExpectedLifePartnerRouter = express_1.default.Router();
ExpectedLifePartnerRouter.route("/")
    .get(expected_lifepartner_controller_1.ExpectedLifePartnerController.getExpectedLifePartner)
    .post((0, auth_1.auth)("user", "admin"), expected_lifepartner_controller_1.ExpectedLifePartnerController.createExpectedLifePartner)
    .put((0, auth_1.auth)("user", "admin"), expected_lifepartner_controller_1.ExpectedLifePartnerController.updateExpectedLifePartner);
ExpectedLifePartnerRouter.route("/:id/user-id").get(expected_lifepartner_controller_1.ExpectedLifePartnerController.getExpectedLifePartnerByUserId);
ExpectedLifePartnerRouter.route("/:id")
    .get(expected_lifepartner_controller_1.ExpectedLifePartnerController.getSingleExpectedLifePartner)
    .delete(expected_lifepartner_controller_1.ExpectedLifePartnerController.deleteExpectedLifePartner);
exports.default = ExpectedLifePartnerRouter;
