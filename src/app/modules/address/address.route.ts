import express from "express";
import { AddressController } from "./address.controller";
import { auth } from "../../middlewares/auth";
const AddressRouter = express.Router();

AddressRouter.route("/")
	.get(AddressController.getAddress)
	.put(auth("user", "admin"), AddressController.updateAddress)
	.post(auth("user", "admin"), AddressController.createAddress);

AddressRouter.route("/:id/user-id").get(
	AddressController.getAddressInfoByUserId
);

AddressRouter.route("/:id")
	.get(AddressController.getSingleAddress)
	.delete(AddressController.deleteAddress);

export default AddressRouter;
