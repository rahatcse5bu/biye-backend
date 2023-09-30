"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const address_controller_1 = require("./address.controller");
const auth_1 = require("../../middlewares/auth");
const AddressRouter = express_1.default.Router();
AddressRouter.route("/")
    .get(address_controller_1.AddressController.getAddress)
    .put((0, auth_1.auth)("user", "admin"), address_controller_1.AddressController.updateAddress)
    .post((0, auth_1.auth)("user", "admin"), address_controller_1.AddressController.createAddress);
AddressRouter.route("/:id/user-id").get(address_controller_1.AddressController.getAddressInfoByUserId);
AddressRouter.route("/:id")
    .get(address_controller_1.AddressController.getSingleAddress)
    .delete(address_controller_1.AddressController.deleteAddress);
exports.default = AddressRouter;
