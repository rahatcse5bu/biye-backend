"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bio_data_controller_1 = require("./bio_data.controller");
const auth_1 = require("../../middlewares/auth");
const BioDataRouter = express_1.default.Router();
BioDataRouter.route("/:id").get(bio_data_controller_1.BioDataController.getBioData);
BioDataRouter.route("/admin/:id").get((0, auth_1.auth)("admin"), bio_data_controller_1.BioDataController.getBioDataByAdmin);
exports.default = BioDataRouter;
