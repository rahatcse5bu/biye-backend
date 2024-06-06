"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middlewares/auth");
const expected_lifepartner_controller_1 = require("./expected_lifepartner.controller");
const ExpectedLifePartnerRouter = express_1.default.Router();
ExpectedLifePartnerRouter.route("/")
    .get(expected_lifepartner_controller_1.ExpectedPartnerController.getAllExpectedPartners)
    .post((0, auth_1.auth)("user", "admin"), expected_lifepartner_controller_1.ExpectedPartnerController.createExpectedPartner)
    .put((0, auth_1.auth)("user", "admin"), expected_lifepartner_controller_1.ExpectedPartnerController.updateExpectedPartner);
ExpectedLifePartnerRouter.route("/token").get((0, auth_1.auth)("admin", "user"), expected_lifepartner_controller_1.ExpectedPartnerController.getExpectedPartnerByToken);
ExpectedLifePartnerRouter.route("/:id")
    .get((0, auth_1.auth)("admin"), expected_lifepartner_controller_1.ExpectedPartnerController.getExpectedPartnerById)
    .delete((0, auth_1.auth)("admin"), expected_lifepartner_controller_1.ExpectedPartnerController.deleteExpectedPartner);
exports.default = ExpectedLifePartnerRouter;
