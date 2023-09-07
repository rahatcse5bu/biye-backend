"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const occupation_controller_1 = require("./occupation.controller");
const OccupationRouter = express_1.default.Router();
OccupationRouter
    .route('/')
    .get(occupation_controller_1.OccupationController.getOccupation)
    .post(occupation_controller_1.OccupationController.createOccupation);
OccupationRouter
    .route('/:id')
    .get(occupation_controller_1.OccupationController.getSingleOccupation)
    .put(occupation_controller_1.OccupationController.updateOccupation)
    .delete(occupation_controller_1.OccupationController.deleteOccupation);
exports.default = OccupationRouter;
