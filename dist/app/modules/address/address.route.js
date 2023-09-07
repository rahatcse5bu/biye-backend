"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const address_controller_1 = require("./address.controller");
const AddressRouter = express_1.default.Router();
AddressRouter.route("/")
    .get(address_controller_1.AddressController.getAddress)
    .post(address_controller_1.AddressController.createAddress);
AddressRouter.route("/:id")
    .get(address_controller_1.AddressController.getSingleAddress)
    .put(address_controller_1.AddressController.updateAddress)
    .delete(address_controller_1.AddressController.deleteAddress);
exports.default = AddressRouter;
