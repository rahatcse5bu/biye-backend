"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middlewares/auth");
const address_controller_1 = require("./address.controller");
const AddressRouter = express_1.default.Router();
AddressRouter.route("/")
    .get(address_controller_1.AddressController.getAllAddresses)
    .put((0, auth_1.auth)("user", "admin"), address_controller_1.AddressController.updateAddress)
    .post((0, auth_1.auth)("user", "admin"), address_controller_1.AddressController.createAddress);
AddressRouter.route("/token").get((0, auth_1.auth)("user", "admin"), address_controller_1.AddressController.getAddressByToken);
AddressRouter.route("/:id")
    .get(address_controller_1.AddressController.getAddressById)
    .delete(address_controller_1.AddressController.deleteAddress);
exports.default = AddressRouter;
